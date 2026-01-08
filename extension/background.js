let isCapturing = false;
let recordingInterval = null;
let currentTabId = null;

const RECORDING_DURATION = 5000; // 5 seconds
const BACKEND_URL = 'http://localhost:8000';

let chunkIndex = 0;

console.log('tabCapture available:', !!chrome.tabCapture);
console.log('tabCapture.getMediaStreamId available:', !!chrome.tabCapture?.getMediaStreamId);


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.action === 'startCapture') {
    chunkIndex = 0;
    startCapture(message.tabId);
    sendResponse({ success: true });
  }

  else if (message.action === 'stopCapture') {
    stopCapture();
    sendResponse({ success: true });
  }

  else if (message.action === 'getState') {
    sendResponse({ isCapturing });
  }

  return true;
});


async function startCapture(tabId) {
  try {
    currentTabId = tabId;

    // Create offscreen document if not exists
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (contexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Video deepfake detection'
      });

      await new Promise(r => setTimeout(r, 500));
      console.log('Offscreen document created');
    }

    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId
    });

    const initResponse = await chrome.runtime.sendMessage({
      action: 'initCapture',
      streamId
    });

    if (!initResponse?.success) {
      throw new Error(initResponse?.error || 'Failed to init capture');
    }

    isCapturing = true;
    notifyPopup('status', 'Recording video...');
    startPeriodicRecording();

  } catch (err) {
    console.error('Start capture error:', err);
    notifyPopup('error', err.message);
  }
}


function startPeriodicRecording() {
  setTimeout(recordAndSendVideo, 1000);

  recordingInterval = setInterval(
    recordAndSendVideo,
    RECORDING_DURATION + 1000
  );
}

async function recordAndSendVideo() {
  if (!isCapturing) return;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'captureVideo',
      duration: RECORDING_DURATION
    });

    if (!response?.success || !response.videoDataUrl) {
      console.warn('No video captured');
      return;
    }

    const fetchRes = await fetch(response.videoDataUrl);
    const videoBlob = await fetchRes.blob();

    chunkIndex += 1;
    console.log(`Video chunk ${chunkIndex}`, videoBlob.size);
    console.log(videoBlob.type)

    await sendVideoToBackend(videoBlob);

  } catch (err) {
    console.error('Recording error:', err);
  }
}




async function sendVideoToBackend(videoBlob) {
  try {
    const formData = new FormData();
    formData.append('video', videoBlob, 'chunk.webm');

    const res = await fetch(`${BACKEND_URL}/predict`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    const result = await res.json();
    

    const payload = {
      ...result,
      chunkIndex
    };
    console.log(payload)
    notifyPopup('result', payload);
    notifyPopup(
      'status',
      `Analyzed ${chunkIndex * 5 - 5}s - ${chunkIndex * 5}s`
    );

  } catch (err) {
    console.error('Backend error:', err);
    notifyPopup('error', err.message);
  }
}


async function stopCapture() {
  isCapturing = false;
  chunkIndex = 0;

  if (recordingInterval) {
    clearInterval(recordingInterval);
    recordingInterval = null;
  }

  await new Promise(r => setTimeout(r, 2000));

  try {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });

    if (contexts.length > 0) {
      await chrome.offscreen.closeDocument();
      console.log('Offscreen closed');
    }
  } catch (e) {
    console.warn('Offscreen close error:', e);
  }

  notifyPopup('status', 'Capture stopped');
}


function notifyPopup(type, payload) {
  chrome.runtime.sendMessage(
    {
      type,
      message: typeof payload === 'string' ? payload : undefined,
      data: typeof payload === 'object' ? payload : undefined
    },
    () => {
      if (chrome.runtime.lastError) return;
    }
  );
}

chrome.runtime.onSuspend.addListener(() => {
  stopCapture();
});
