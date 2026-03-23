# analyzers/video_analyzer.py
import os
import json
import tensorflow as tf
import numpy as np

# import configuration values
from pipeline.config import SEQ_LEN, TEST_STRIDE, BAD_RATIO_LIMIT, FEATURE_BAD_LIMIT_CURL, FEATURE_BAD_LIMIT_SHOULDER, FEATURE_BAD_LIMIT

# import processing modules
from processors.keypoint_extractor import KeypointExtractor
from processors.keypoint_preprocessor import KeypointPreprocessor
from processors.sequence_generator import SequenceGenerator
from processors.error_calculator import ErrorCalculator

# import prompt and KB related modules
from generators.prompt_builder import PromptBuilder, FEATURE_NAMES
from filters.kb_filter import KBFilter
from services.llm import LLM

# import motion rebuilding service
from motion.human_motion_service import HumanMotionService

class VideoAnalyzer:
    """Main video analyzer"""
    
    def __init__(self):
        self.keypoint_extractor = KeypointExtractor()
        self.keypoint_preprocessor = KeypointPreprocessor()
        self.sequence_generator = SequenceGenerator()
        self.error_calculator = ErrorCalculator()
        self.prompt_builder = PromptBuilder()
        self.kb_filter = KBFilter()
        self.llm = LLM()
        self.motion_service = HumanMotionService()

        # cache for loaded models to avoid loading every request
        self.model_cache = {}   

        # cache for loaded thresholds      
        self.threshold_cache = {}      

        # custom objects needed for loading model with attention layer
        self.custom_objects = {
            "MultiHeadAttention": tf.keras.layers.MultiHeadAttention
        }

    def get_model_and_threshold(self, model_path, threshold_path):
        # load model only once and store in cache
        if model_path not in self.model_cache:
            self.model_cache[model_path] = tf.keras.models.load_model(
                model_path,
                custom_objects=self.custom_objects,
                compile=False
            )
        # load threshold only once and store in cache
        if threshold_path not in self.threshold_cache:
            self.threshold_cache[threshold_path] = np.load(threshold_path)

        return self.model_cache[model_path], self.threshold_cache[threshold_path]
    
    #   This is the main function analyzes an exercise video by extracting body keypoints, comparing them with a trained model to detect mistakes, 
    #   and preparing feedback about the user’s posture
    def analyze_video(
        self,
        video_path: str,
        model_path: str,
        threshold_path: str,
        kb_path: str,
        exercise_name: str,
        max_kb: int = 8
    ):

        # Load model + threshold
        model, threshold_feat = self.get_model_and_threshold(model_path, threshold_path)

        # Step 1: Extract keypoints
        raw_df = self.keypoint_extractor.extract_raw_keypoints_df(video_path)
        if raw_df.empty:
            return {"error": "Could not extract keypoints (video read failed)."}

        # Step 2: Preprocess
        df_p = self.keypoint_preprocessor.preprocess_keypoints_df(raw_df)
        if df_p.empty or len(df_p) < SEQ_LEN:
            return {"error": "Not enough usable frames after preprocessing."}
        
        # Step 3: Create sequences
        X = self.sequence_generator.create_sequences_from_video_df(df_p, SEQ_LEN, TEST_STRIDE)
        if len(X) == 0:
            return {"error": "No valid sequences created (too many missing values)."}

        # Step 4: predict once
        reconstructed_data = model.predict(X, verbose=0)            

        # calculate reconstruction error and direction
        errs, errs_di = self.error_calculator.reconstruction_error_and_direction(
            X,
            reconstructed_data
        )

        # rebuild continuous motion from reconstructed windows
        continuous_frames_after = self.motion_service.rebuild_continuous_motion(
            reconstructed_data
        )
        # rebuild continuous motion from original input
        continuous_frames_befor = self.motion_service.rebuild_continuous_motion(
            X
        )

        # check which features exceed threshold
        exceed = errs > threshold_feat
        # calculate ratio of bad features per sequence
        seq_bad_ratio = np.mean(exceed, axis=1)

        # choose feature bad limit based on exercise
        if exercise_name == "barbell_curl":
            feature_bad_limit = FEATURE_BAD_LIMIT_CURL
        elif exercise_name == "dumbbell_shoulder_press":
            feature_bad_limit = FEATURE_BAD_LIMIT_SHOULDER
        else:
            feature_bad_limit = FEATURE_BAD_LIMIT

        # mark sequence as bad if many features exceed
        seq_is_bad = seq_bad_ratio > feature_bad_limit
        # calculate overall bad sequence ratio
        bad_ratio = float(np.mean(seq_is_bad))
        # final label decision
        label = "CORRECT" if bad_ratio <= BAD_RATIO_LIMIT else "WRONG"
        mean_error = float(np.mean(errs))

        # Step 5: build detailed prompt for LLM
        first_bad_sequence, first_bad_frame, sequence_keypoint_errors = self.prompt_builder.build_sequence_error_report(
            errs=errs,
            exceed=exceed,
            errs_di=errs_di,
            seq_is_bad=seq_is_bad
        )
        # summarize errors keypoint wise
        keypoint_summary = self.prompt_builder.make_keypoint_wise_summary(sequence_keypoint_errors, FEATURE_NAMES)

        # build user prompt for LLM
        user_prompt = self.prompt_builder.build_llm_prompt_keypoint_wise(
            exercise_name=exercise_name,
            label=label,
            first_bad_sequence=first_bad_sequence,
            first_bad_frame=first_bad_frame,
            keypoint_summary=keypoint_summary,
            FEATURE_NAMES=FEATURE_NAMES,
            SEQ_LEN=SEQ_LEN,
            MAX_SEQ_SHOW=12
        )

        # Step 6: KB filtering
        if not os.path.exists(kb_path):
            filtered_kb = []
            observed_signs = {}
        else:
            with open(kb_path, "r", encoding="utf-8") as f:
                kb_entries = json.load(f)

            filtered_kb, observed_signs = self.kb_filter.filter_KB_by_keypoints_and_direction(
                kb_entries=kb_entries,
                keypoint_summary=keypoint_summary,
                eps=1e-4,
                require_all_features=True,
                drop_guides=True
            )

        # Step 7: combine user prompt and filtered KB
        kb_block = json.dumps(
            {"observed_signs": observed_signs, "matched_kb": filtered_kb[:max_kb]},
            indent=2,
            ensure_ascii=False
        )

        final_prompt = (
            user_prompt
            + "\n\n---\n"
            + "Coaching KB (already filtered to match the detected keypoint directions). "
            + "Use this KB to make your feedback more accurate.\n"
            + kb_block
            + "\n---\n"
            + "Write the final feedback now."
        )

        # Step 8: call LLM to generate feedback text
        feedback_text = self.llm.call_llm(final_prompt)

        # Final output
        return {
            "video": os.path.basename(video_path),
            "label": label,
            "mean_error": mean_error,
            "bad_ratio": bad_ratio,
            "sequences": int(len(X)),
            "frames_used": int(len(df_p)),
            "first_bad_sequence": first_bad_sequence,
            "first_bad_frame": first_bad_frame,
            "observed_signs": observed_signs,
            "matched_kb_count": int(len(filtered_kb)),
            "feedback": feedback_text,
            "continuous_frames_after":continuous_frames_after,
            "continuous_frames_before":continuous_frames_befor,
            "continuous_frames1":reconstructed_data.tolist()
        }