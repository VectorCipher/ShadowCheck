# ShadowCheck

With the rapid rise of AI-generated and manipulated videos, distinguishing real content from deepfakes has become increasingly difficult. ShadowCheck addresses this challenge by providing real-time, on-device video capture and server-side AI inference, integrated seamlessly into a Chrome Extension.

The system captures short video segments from active browser tabs, sends them to a backend deepfake detection model, and presents authenticity insights directly to the user — all without disrupting the viewing experience.

✨ Key Features

🎥 Real-time video capture from browser tabs

🧠 AI-based deepfake detection on video chunks

🧩 Chrome Extension (Manifest V3) architecture

🕶️ Offscreen document capture (no UI interference)

🔁 Chunk-based analysis for continuous monitoring

🌐 Backend inference via REST API

🔔 Live detection status & results in popup UI