# main.py
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models.exercise import Exercise
from models.video import Video
from analyzers.video_analyzer import VideoAnalyzer

app = FastAPI(title="ReForm Backend", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = VideoAnalyzer()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze_url")
async def analyze_from_url(
    exercise: str = Form(...),
    video_url: str = Form(...),
):
    exercise = exercise.strip().lower()

    # Get exercise config
    try:
        cfg = Exercise.get_config(exercise)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid exercise. Allowed: barbell_curl, dumbbell_shoulder_press"
        )

    # Download video
    try:
        video = Video.from_url(video_url)
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to download video")

    try:
        # Run analysis
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
        video.cleanup()