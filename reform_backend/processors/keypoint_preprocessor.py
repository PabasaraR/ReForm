# processors/keypoint_preprocessor.py
import numpy as np
from scipy.signal import savgol_filter
from pipeline.config import *

class KeypointPreprocessor:
    # Takes a raw keypoint DataFrame and returns a cleaned, centered, scaled, and smoothed version.
    def preprocess_keypoints_df(self, df):

        raw_keypoints_df = df.copy()

        # Get the x and y column names that will be used for preprocessing
        column_names = [f"x_{kp}" for kp in KP_INDICES] + [f"y_{kp}" for kp in KP_INDICES]

        # Remove unreliable keypoints using visibility
        for kp in KP_INDICES:
            bad = raw_keypoints_df[f"v_{kp}"] < VIS_THRESHOLD
            raw_keypoints_df.loc[bad, f"x_{kp}"] = np.nan
            raw_keypoints_df.loc[bad, f"y_{kp}"] = np.nan

        # Remove frames with too much missing data
        valid_frac = raw_keypoints_df[column_names].notna().mean(axis=1)
        raw_keypoints_df = raw_keypoints_df[valid_frac >= MIN_VALID_KEYPOINT_RATIO].reset_index(drop=True)
        if raw_keypoints_df.empty:
            return raw_keypoints_df

        # Interpolate small gaps in the motion
        raw_keypoints_df[column_names] = raw_keypoints_df[column_names].interpolate(
            method="linear",
            limit=INTERP_LIMIT,
            limit_direction="both"
        )

        # Center body at the midpoint of the hips (removes camera position differences)
        mid_x = (raw_keypoints_df["x_23"] + raw_keypoints_df["x_24"]) / 2.0
        mid_y = (raw_keypoints_df["y_23"] + raw_keypoints_df["y_24"]) / 2.0
        for kp in KP_INDICES:
            raw_keypoints_df[f"x_{kp}"] = raw_keypoints_df[f"x_{kp}"] - mid_x
            raw_keypoints_df[f"y_{kp}"] = raw_keypoints_df[f"y_{kp}"] - mid_y

        # Normalize scale using shoulder width
        shoulder_w = np.sqrt((raw_keypoints_df["x_12"] - raw_keypoints_df["x_11"])**2 + (raw_keypoints_df["y_12"] - raw_keypoints_df["y_11"])**2)
        for kp in KP_INDICES:
            raw_keypoints_df[f"x_{kp}"] = raw_keypoints_df[f"x_{kp}"] / (shoulder_w + EPS)
            raw_keypoints_df[f"y_{kp}"] = raw_keypoints_df[f"y_{kp}"] / (shoulder_w + EPS)

        # Smooth the motion to reduce jitter
        if SMOOTH and len(raw_keypoints_df) >= SMOOTH_WINDOW:
            for col in column_names:
                try:
                    raw_keypoints_df[col] = savgol_filter(raw_keypoints_df[col].values, SMOOTH_WINDOW, SMOOTH_POLY)
                except Exception:
                    pass

        return raw_keypoints_df