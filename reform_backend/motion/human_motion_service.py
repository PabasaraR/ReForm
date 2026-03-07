# motion/human_motion_service.py
import numpy as np
from typing import List, Sequence
from dataclasses import dataclass

# Read configuration values from your pipeline
from pipeline.config import SEQ_LEN, TEST_STRIDE


@dataclass
class MotionSettings:
    # Holds configuration values for motion rebuilding
    sequence_length: int = SEQ_LEN
    test_stride: int = TEST_STRIDE
    enable_smoothing: bool = False
    smoothing_window: int = 10


class HumanMotionService:

    # Initialize service with motion settings
    def __init__(self, motion_settings: MotionSettings = None):
        if motion_settings is None:
            motion_settings = MotionSettings()
        self.motion_settings = motion_settings


    # Main function
    # Receives model output windows with shape N 32 16
    # Returns continuous sequence with shape T 16
    def rebuild_continuous_motion(self,window_outputs):

        # Convert input into numpy array
        model_array = np.asarray(window_outputs, dtype=np.float32)

        # Validate input dimension
        if model_array.ndim != 3:
            raise ValueError("Input must be shape N 32 16")

        number_of_windows, seq_len, feature_count = model_array.shape

        # Check sequence length
        if seq_len != self.motion_settings.sequence_length:
            raise ValueError(
                f"Expected sequence length {self.motion_settings.sequence_length} but got {seq_len}"
            )

        # Check feature size
        if feature_count != 16:
            raise ValueError("Expected 16 features per frame")

        # Step 1: Merge overlapping windows
        continuous_motion = self._merge_overlapping_windows(
            model_array,
            self.motion_settings.test_stride
        )

        # Step 2: Optional smoothing
        if self.motion_settings.enable_smoothing:
            continuous_motion = self._apply_moving_average(
                continuous_motion,
                self.motion_settings.smoothing_window
            )

        # Convert back to normal python list for JSON response
        return continuous_motion.astype(np.float32).tolist()


    # Merge overlapping windows using overlap add averaging
    def _merge_overlapping_windows(self,model_array,stride_value):

        number_of_windows, seq_len, feature_count = model_array.shape

        # Calculate total frames after merging
        total_frames = (number_of_windows - 1) * stride_value + seq_len

        sum_array = np.zeros((total_frames, feature_count), dtype=np.float32)
        count_array = np.zeros((total_frames, 1), dtype=np.float32)

        # Add each window into correct time position
        for window_index in range(number_of_windows):
            start_frame = window_index * stride_value
            end_frame = start_frame + seq_len

            sum_array[start_frame:end_frame] += model_array[window_index]
            count_array[start_frame:end_frame] += 1.0

        # Avoid division by zero
        count_array = np.maximum(count_array, 1.0)

        # Average overlapping regions
        return sum_array / count_array


    # Apply simple moving average smoothing
    def _apply_moving_average(self,continuous_array,window_size):

        if window_size <= 1:
            return continuous_array

        total_frames, feature_count = continuous_array.shape
        smoothed_array = np.empty_like(continuous_array)

        half_window = window_size // 2

        for frame_index in range(total_frames):
            lower_bound = max(0, frame_index - half_window)
            upper_bound = min(total_frames, frame_index + half_window + 1)

            smoothed_array[frame_index] = continuous_array[
                lower_bound:upper_bound
            ].mean(axis=0)

        return smoothed_array