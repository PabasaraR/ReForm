# processors/keypoint_extractor.py
import cv2
import numpy as np
import pandas as pd
import mediapipe as mp
from pipeline.config import KP_INDICES

class KeypointExtractor:

    # Reads a video file frame by frame, extracts pose keypoints using MediaPipe,and saves them into a CSV file.
    def extract_raw_keypoints_df(self, video_path):

        # Open the video file
        test_video_capture = cv2.VideoCapture(video_path)

        # Check whether the video was opened successfully
        if not test_video_capture.isOpened():
            return pd.DataFrame()
        
        # Initialize MediaPipe Pose model
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=False,                    # Video mode
            model_complexity=2,                         # Higher accuracy model
            min_detection_confidence=0.5,               # Minimum detection confidence
            min_tracking_confidence=0.5                 # Minimum tracking confidence
        )

        rows = []
        frame_idx = 0

        # Read video frame by frame
        while True:
            ret, frame = test_video_capture.read()
            if not ret:
                break
            frame_idx += 1

            # Convert frame from BGR to RGB because MediaPipe requires RGB
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            # Run pose detection on the current frame
            res = pose.process(rgb)

            # Create dictionary for current frame
            row = {"frame": frame_idx}

            # Extract required keypoints defined in KP_INDICES
            if res.pose_landmarks:
                for kp in KP_INDICES:
                    lm = res.pose_landmarks.landmark[kp]
                    row[f"x_{kp}"] = float(lm.x)
                    row[f"y_{kp}"] = float(lm.y)
                    row[f"v_{kp}"] = float(getattr(lm, "visibility", 0.0))
            else:
                # If no pose detected, store NaN values
                for kp in KP_INDICES:
                    row[f"x_{kp}"] = np.nan
                    row[f"y_{kp}"] = np.nan
                    row[f"v_{kp}"] = np.nan

            rows.append(row)

        test_video_capture.release()
        pose.close()

        # return collected data 
        return pd.DataFrame(rows)