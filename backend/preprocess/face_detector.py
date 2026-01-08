import cv2

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

def extract_faces(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    detections = face_cascade.detectMultiScale(gray, 1.3, 5)

    faces = []
    for (x, y, w, h) in detections:
        face = frame[y:y+h, x:x+w]
        if face.size > 0:
            faces.append(face)

    return faces
