# main.py
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.exercise import Exercise
from models.video import Video
from analyzers.video_analyzer import VideoAnalyzer

# create FastAPI app
app = FastAPI(title="ReForm Backend", version="1.0")

# enable CORS so frontend can access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create analyzer object
analyzer = VideoAnalyzer()

# API to analyze video from URL
@app.post("/analyze_url")
async def analyze_from_url(
    exercise: str = Form(...),      # exercise name 
    video_url: str = Form(...),     # video URL
):
    exercise = exercise.strip().lower()

    # get config for selected exercise
    try:
        cfg = Exercise.get_config(exercise)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid exercise. Allowed: barbell_curl, dumbbell_shoulder_press"
        )

    # download video from given URL
    try:
        video = Video.from_url(video_url)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to download video")

    try:
        # run video analysis using model and config
        result = analyzer.analyze_video(
            video_path=video.video_path,
            model_path=cfg.model_path,
            threshold_path=cfg.threshold_path,
            kb_path=cfg.kb_path,
            exercise_name=cfg.exercise_name,
        )

        return {
            "exercise": exercise,
            "result": result,
        }

    finally:
        # always delete temporary video file
        video.cleanup()

@app.get("/")
def home():
    return {"message": "Python backend is running"}