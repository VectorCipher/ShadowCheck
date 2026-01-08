import cv2

def extract_frames(video_path, fps=1):
    cap = cv2.VideoCapture(video_path)

    video_fps = cap.get(cv2.CAP_PROP_FPS)
    interval = max(int(video_fps // fps), 1)

    frames = []
    idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if idx % interval == 0:
            frames.append(frame)

        idx += 1

    cap.release()
    return frames
