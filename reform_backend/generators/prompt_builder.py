# generators/prompt_builder.py
import numpy as np
from pipeline.config import KP_INDICES

# create feature names
FEATURE_NAMES = (
    [f"x_{kp}" for kp in KP_INDICES] +
    [f"y_{kp}" for kp in KP_INDICES]
)

class PromptBuilder:
    #   Build detailed error report for each sequence
    def build_sequence_error_report(self, errs, exceed, errs_di, seq_is_bad):
  
        from pipeline.config import TEST_STRIDE
        # find indices of bad sequences
        bad_seq_indices = np.where(seq_is_bad)[0]
        # get first bad sequence index
        first_bad_sequence = int(bad_seq_indices[0]) if len(bad_seq_indices) > 0 else None
        # calculate approximate frame where first error starts
        first_bad_frame = (first_bad_sequence * TEST_STRIDE) if first_bad_sequence is not None else None

        sequence_keypoint_errors = []

        n_features = len(FEATURE_NAMES)

        # loop through each sequence
        for seq in range(errs.shape[0]):
            # store error value for each feature
            feature_errors_dict = {FEATURE_NAMES[i]: float(errs[seq, i]) for i in range(n_features)}
            # store whether each feature exceeds threshold (True or False)
            feature_exceed_dict = {FEATURE_NAMES[i]: bool(exceed[seq, i]) for i in range(n_features)}
            # store direction of error (positive or negative)
            feature_dir_dict = {FEATURE_NAMES[i]: float(errs_di[seq, i]) for i in range(n_features)}

            # add all information for this sequence
            sequence_keypoint_errors.append({
                "sequence_index": int(seq),
                "approx_start_frame": int(seq * TEST_STRIDE),
                "is_bad_sequence": bool(seq_is_bad[seq]),
                "bad_keypoint_ratio": float(np.mean(exceed[seq])),
                "errors": feature_errors_dict,
                "exceed": feature_exceed_dict,
                "direction": feature_dir_dict
            })

        return first_bad_sequence, first_bad_frame, sequence_keypoint_errors

    # Create summary for each keypoint (feature)
    def make_keypoint_wise_summary(self, sequence_keypoint_errors, FEATURE_NAMES):
        keypoint_summary = {}

        # loop through each feature
        for feat in FEATURE_NAMES:
            errors_by_seq = []
            direction_by_seq = []
            exceed_seqs = []

            # loop through each sequence
            for seq in sequence_keypoint_errors:
                # get sequence index and frame
                seq_i = int(seq["sequence_index"])
                fr_i = int(seq["approx_start_frame"])

                # get error, direction and exceed info for this feature
                e = float(seq["errors"][feat])
                d = float(seq["direction"][feat])
                ex = bool(seq["exceed"][feat])
                # store error value with sequence info
                errors_by_seq.append({"seq": seq_i, "frame": fr_i, "val": e})
                # store direction value with sequence info
                direction_by_seq.append({"seq": seq_i, "frame": fr_i, "val": d})

                if ex:
                    exceed_seqs.append(seq_i)
            # calculate average error for this feature
            mean_error = float(np.mean([x["val"] for x in errors_by_seq])) if errors_by_seq else 0.0
            # calculate average direction for this feature
            mean_direction = float(np.mean([x["val"] for x in direction_by_seq])) if direction_by_seq else 0.0
            # calculate how often this feature is bad across sequences
            exceed_rate = float(len(exceed_seqs) / max(1, len(sequence_keypoint_errors)))
            # store all summary data for this feature
            keypoint_summary[feat] = {
                "errors_by_seq": errors_by_seq,
                "direction_by_seq": direction_by_seq,
                "exceed_seqs": exceed_seqs,
                "exceed_rate": exceed_rate,
                "mean_error": mean_error,
                "mean_direction": mean_direction,
            }

        return keypoint_summary

    # Build prompt text for LLM using keypoint error summary
    def build_llm_prompt_keypoint_wise(
        self,
        exercise_name,
        label,
        first_bad_sequence,
        first_bad_frame,
        keypoint_summary,
        FEATURE_NAMES,
        SEQ_LEN=32,
        MAX_SEQ_SHOW=12
    ):
        """Build LLM prompt - same logic as original"""
        lines = []
        # basic instruction for LLM
        lines.append("You are a fitness coach. Generate clear, short feedback for a user's bicep curl or shoulder press technique.\n")
        # add exercise name
        lines.append(f"Exercise: {exercise_name.replace('_', ' ').title()}")
        # add final prediction result correct or wrong
        lines.append(f"Final decision(exercise is corect or wrong): {label}")
        # if there is an error, show where it starts
        if first_bad_sequence is not None:
            lines.append(f"Error starts at: sequence {first_bad_sequence} (approx frame {first_bad_frame})")
        lines.append("")
        # explain what each keypoint means
        lines.append("Keypoint mapping:")
        lines.append(
            "x_11 left shoulder (horizontal movement), x_12 right shoulder (horizontal movement),\n"
            "x_13 left elbow (horizontal movement), x_14 right elbow (horizontal movement),\n"
            "x_15 left wrist (horizontal movement), x_16 right wrist (horizontal movement),\n"
            "x_23 left hip (horizontal movement), x_24 right hip (horizontal movement),\n"
            "y_11.y_24 are the same joints (vertical movement).\n"
            "(these are the mediapipe key points representation)\n"
        )
        # explain meaning of data
        lines.append("Data notes:")
        lines.append(f"- Each sequence contains {SEQ_LEN} frames.")
        lines.append("- error is MSE (always positive). Larger = more abnormal.")
        lines.append("- direction is signed mean (X - reconstructed). Can be + or -.")
        lines.append("  * For left-side keypoints (e.g., left wrist 15, left elbow 13):")
        lines.append("    + Positive (+) x-direction means the keypoint is further from its normal horizontal position, typically moving outward from the body.")
        lines.append("    + Negative (−) x-direction means the keypoint is closer to its normal horizontal position, typically moving inward toward the body.")
        lines.append("  * For right-side keypoints (e.g., right wrist 16, right elbow 14):")
        lines.append("    + Negative (−) x-direction means the keypoint is further from its normal horizontal position, typically moving outward from the body.")
        lines.append("    + Positive (+) x-direction means the keypoint is closer to its normal horizontal position, typically moving inward toward the body.")
        lines.append("- exceed means this keypoint exceeded its own threshold in that sequence.")
        lines.append("")
        # select only important wrong keypoints
        wrong_feats = [feat for feat in FEATURE_NAMES if keypoint_summary[feat]["exceed_rate"] > 0.125]

        if len(wrong_feats) == 0:
            show_feats = []
        else:
            def sort_key(feat):
                return (keypoint_summary[feat]["exceed_rate"], keypoint_summary[feat]["mean_error"])

            show_feats = sorted(wrong_feats, key=sort_key, reverse=True)

        # function to format sequence values into readable text
        def format_sequence_values(seq_values, signed=False):
            out = []
            for v in seq_values[:MAX_SEQ_SHOW]:
                if signed:
                    out.append(f"(seq {v['seq']}, fr {v['frame']}): {v['val']:+.6f}")
                else:
                    out.append(f"(seq {v['seq']}, fr {v['frame']}): {v['val']:.6f}")
            return " | ".join(out)

        lines.append("Keypoint-wise abnormality summary (each keypoint across sequences):\n")
        # loop through selected important features
        for feat in show_feats:
            info = keypoint_summary[feat]
            exceed_seqs = info["exceed_seqs"]

            lines.append(f"Keypoint: {feat}")
            lines.append(f"- exceed_rate: {info['exceed_rate']:.2f}  | mean_error: {info['mean_error']:.6f}  | mean_direction: {info['mean_direction']:+.6f}")

            if len(exceed_seqs) > 0:
                ex_str = str(exceed_seqs)
                lines.append(f"- exceeded in sequences: {ex_str}")
            else:
                lines.append("- exceeded in sequences: []")

            lines.append("- error trend (first sequences shown):")
            lines.append("  " + format_sequence_values(info["errors_by_seq"], signed=False))
            lines.append("- direction trend (first sequences shown):")
            lines.append("  " + format_sequence_values(info["direction_by_seq"], signed=True))

            lines.append("")
        # instructions for LLM output
        lines.append("Task:")
        lines.append("1) Explain what is wrong in 1–2 short sentences.")
        lines.append("2) Give 2–3 specific correction tips.")
        lines.append("3) Mention the body parts likely causing the issue (elbow/shoulder/hip/wrist).")
        lines.append("4) Keep it simple, like: Your bicep curl is wrong. Your elbow moves forward. Keep your elbow steady.")
        lines.append("Only return the feedback text. Do not return JSON.")
        lines.append("Remember, only gave feedback if the final decision is wrong. If the final decision is correct, say something like: Your bicep curl looks good! Keep it up!")

        return "\n".join(lines)