# models/exercise.py
from dataclasses import dataclass
# Store configuration details for an exercise
@dataclass
class Exercise:
    exercise_name: str      # name of the exercise
    model_path: str         # path to trained model file
    threshold_path: str     # path to threshold file
    kb_path: str            # path to knowledge base file

    @classmethod
    def get_config(cls, exercise: str):
        # dictionary storing configs for each exercise
        configs = {
            "barbell_curl": cls(
                exercise_name="barbell_curl",
                model_path="ml_models/best_bicep_model.keras",
                threshold_path="results/bicep_threshold_feat.npy",
                kb_path="kb/bicep_curl_kb.json"
            ),
            "dumbbell_shoulder_press": cls(
                exercise_name="dumbbell_shoulder_press",
                model_path="ml_models/best_shoulder_model.keras",
                threshold_path="results/shoulder_threshold_feat.npy",
                kb_path="kb/shoulder_press_kb.json"
            ),
        }
        # check if given exercise exists in config
        if exercise not in configs:
            raise ValueError(f"Invalid exercise: {exercise}")
        # return matching configuration
        return configs[exercise]