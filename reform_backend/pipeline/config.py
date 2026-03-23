# pipeline/config.py

# 11-Left shoulder,12-Right shoulder,13-Left elbow,14-Right elbow,15-Left wrist,16-Right wrist,23-Left hip,24-Right hip
KP_INDICES = [11, 12, 13, 14, 15, 16, 23, 24] 


SEQ_LEN = 46
FEATURES = 16
TEST_STRIDE = 8

VIS_THRESHOLD = 0.6                 # Confidence value the ignores keypoints
MIN_VALID_KEYPOINT_RATIO = 0.67     # Minimum valid x/y points required per frame
INTERP_LIMIT = 5                    # Maximum number of values to interpolate

SMOOTH = True
SMOOTH_WINDOW = 7
SMOOTH_POLY = 2

EPS = 1e-6                          # Small value to avoid division by zero during shoulder-width normalization

BAD_RATIO_LIMIT = 0.20
FEATURE_BAD_LIMIT_CURL = 0.38
FEATURE_BAD_LIMIT_SHOULDER = 0.38
FEATURE_BAD_LIMIT = 0.25
