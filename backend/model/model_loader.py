from transformers import AutoImageProcessor, AutoModelForImageClassification

MODEL_NAME = "prithivMLmods/Deep-Fake-Detector-Model"

def load_hf_model(device="cpu"):
    processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
    model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)

    model.to(device)
    model.eval()

    return model, processor
