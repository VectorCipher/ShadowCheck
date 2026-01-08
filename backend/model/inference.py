import torch
import numpy as np

def predict_faces(model, processor, faces, device="cpu"):
    inputs = processor(images=faces, return_tensors="pt").to(device)

    with torch.no_grad():
        outputs = model(**inputs)

    probs = torch.softmax(outputs.logits, dim=1)

    # ⚠️ class index 1 = FAKE for this model
    fake_scores = probs[:, 1].cpu().numpy()

    return fake_scores

def aggregate_scores(scores):
    return float(np.mean(scores))
