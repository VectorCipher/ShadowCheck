from fastapi import FastAPI, UploadFile,File
import os
import uuid
from preprocess.video_io import save_video
from preprocess.frame_extractor import extract_frames
from preprocess.face_detector import extract_faces
from preprocess.transform import to_pil
from fastapi.responses import JSONResponse
from model.model_loader import load_hf_model
from model.inference import predict_faces, aggregate_scores

app = FastAPI()

DEVICE = "cuda" if False else "cpu"
model, processor = load_hf_model(DEVICE)

RAW_VIDEO_DIR = "videos/raw"
os.makedirs(RAW_VIDEO_DIR, exist_ok=True)

# ==================================================
# RECEIVE + SAVE VIDEO (DEBUG FRIENDLY)
# ==================================================
@app.post("/predict")
async def predict(video: UploadFile= File(...)):
    video_id = str(uuid.uuid4())
    video_path = os.path.join(RAW_VIDEO_DIR,f"{video_id}.webm")
    with open (video_path,"wb") as f:
        f.write(await video.read())
    print(f"Saved recorded video at: {video_path}") 
    frames = extract_frames(video_path)
    
    all_faces = []
    for frame in frames:
        faces = extract_faces(frame)
        all_faces.extend([to_pil(face) for face in faces])

    if len(all_faces) == 0:
        return {
            "prediction": 0,
            "confidence": 0.0,
            "reason":"No faces Detected"
        }

    scores = predict_faces(model, processor, all_faces, DEVICE)
    final_score = aggregate_scores(scores)

    return {
        "prediction": int(final_score > 0.6),
        "confidence": round(final_score, 4)
    }
