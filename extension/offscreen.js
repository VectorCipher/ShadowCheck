let capturedStream = null;

console.log("📽️ Offscreen VIDEO script loaded");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Offscreen received message:", message);

 
  if (message.action === "initCapture") {
    console.log("Handling initCapture (video)");

    initializeVideoCapture(message.streamId)
      .then(() => {
        console.log("Video capture initialized");
        sendResponse({ success: true });
      })
      .catch((err) => {
        console.error(" Init failed:", err);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }

 
  if (message.action === "captureVideo") {
    console.log("Handling captureVideo");

    captureVideo(message.duration)
      .then((videoDataUrl) => {
        console.log(
          "🎬 Video captured, data URL length:",
          videoDataUrl?.length
        );
        sendResponse({ success: true, videoDataUrl });
      })
      .catch((err) => {
        console.error("❌ Capture failed:", err);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }

  console.warn("Unknown action:", message.action);
  return false;
});


async function initializeVideoCapture(streamId) {
  console.log("initializeVideoCapture called with streamId:", streamId);

  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      mandatory: {
        chromeMediaSource: "tab",
        chromeMediaSourceId: streamId,
      },
    },
    audio: false, // 
  });

  capturedStream = stream;

  console.log("🎥 Video stream ready");
  console.log("Video tracks:", stream.getVideoTracks().length);
}


async function captureVideo(duration) {
  return new Promise((resolve, reject) => {
    try {
      console.log("captureVideo called, duration:", duration);

      if (!capturedStream) {
        reject(new Error("No captured video stream"));
        return;
      }

      const videoTracks = capturedStream.getVideoTracks();
      console.log("Video tracks found:", videoTracks.length);

      if (videoTracks.length === 0) {
        reject(new Error("No video tracks"));
        return;
      }

      const chunks = [];
      const mediaRecorder = new MediaRecorder(capturedStream, {
        mimeType: "video/webm; codecs=vp9",
      });

      mediaRecorder.onstart = () => {
        console.log("▶️ MediaRecorder started");
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("📦 Video chunk:", event.data.size, "bytes");
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("⏹️ MediaRecorder stopped");

        const blob = new Blob(chunks, { type: "video/webm" });
        console.log("🎞️ Video blob size:", blob.size);

        if (blob.size === 0) {
          reject(new Error("Empty video blob"));
          return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
          console.log("📤 Video converted to DataURL");
          resolve(reader.result);
        };

        reader.onerror = () => {
          reject(new Error("Failed to read video blob"));
        };

        reader.readAsDataURL(blob);
      };

      mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder error:", e.error);
        reject(e.error);
      };

      mediaRecorder.start();

      setTimeout(() => {
        if (mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
        }
      }, duration);

    } catch (err) {
      console.error("Error in captureVideo:", err);
      reject(err);
    }
  });
}
