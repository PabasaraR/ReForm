# processors/sequence_generator.py
import numpy as np
from pipeline.config import *

#   Generate sequences from keypoint data
class SequenceGenerator:
    
    def create_sequences_from_video_df(self, video_keypoints_df, seq_len, stride):
        # select x and y keypoint columns from dataframe 
        feature_cols = [f"x_{kp}" for kp in KP_INDICES] + [f"y_{kp}" for kp in KP_INDICES]

        # convert selected columns to numpy array
        data = video_keypoints_df[feature_cols].values

        sequences = []

        # slide window through data to create sequences
        for start in range(0, len(data) - seq_len + 1, stride):
            # take a chunk of length seq_len
            chunk = data[start:start + seq_len]
            # check if chunk has valid values (no NaN or Inf)
            if not np.isnan(chunk).any() and not np.isinf(chunk).any():
                # add valid sequence to list
                sequences.append(chunk)

        # if no valid sequences found return empty array
        if not sequences:
            return np.empty((0, seq_len, FEATURES), dtype=np.float32)  

        return np.array(sequences, dtype=np.float32)