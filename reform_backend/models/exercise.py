# models/exercise.py
from dataclasses import dataclass

@dataclass
class Exercise:
    """Exercise configuration"""
    
    exercise_name: str
    model_path: str
    threshold_path: str
    kb_path: str
    
    @classmethod
    def get_config(cls, exercise: str):
        """Get config by exercise name"""
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
        
        if exercise not in configs:
            raise ValueError(f"Invalid exercise: {exercise}")
        
        return configs[exercise]