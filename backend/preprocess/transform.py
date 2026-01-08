from PIL import Image

def to_pil(face_bgr):
    # OpenCV → PIL (RGB)
    return Image.fromarray(face_bgr[:, :, ::-1])
