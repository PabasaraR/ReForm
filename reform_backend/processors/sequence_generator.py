# processors/sequence_generator.py
import numpy as np
from pipeline.config import *

class SequenceGenerator:
    """Generate sequences from keypoint data"""
    
    def create_sequences_from_video_df(self, video_keypoints_df, seq_len, stride):
        """Create sequences - same logic as original"""
        feature_cols = [f"x_{kp}" for kp in KP_INDICES] + [f"y_{kp}" for kp in KP_INDICES]
        data = video_keypoints_df[feature_cols].values

        sequences = []

        for start in range(0, len(data) - seq_len + 1, stride):
            chunk = data[start:start + seq_len]

            if not np.isnan(chunk).any() and not np.isinf(chunk).any():
                sequences.append(chunk)

        if not sequences:
            return np.empty((0, seq_len, FEATURES), dtype=np.float32)  

        return np.array(sequences, dtype=np.float32)