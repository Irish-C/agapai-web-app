// client/src/services/streamService.js
// Helper to publish a camera path via backend and perform a WHEP WebRTC handshake

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

async function publishCamera(cameraId) {
  const res = await fetch(`${API_URL}/api/cameras/${cameraId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Publish failed: ${res.status}`);
  return res.json();
}

function waitForIceGatheringComplete(pc, timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const onState = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', onState);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', onState);
    setTimeout(() => {
      pc.removeEventListener('icegatheringstatechange', onState);
      resolve(); // proceed even if gathering incomplete
    }, timeout);
  });
}

export async function startWebRTCStream(cameraId, videoElement, rtcConfig = {}) {
  // 1) Ask backend to publish camera and return media URLs
  const publishResp = await publishCamera(cameraId);
  if (!publishResp || publishResp.error) {
    throw new Error(publishResp?.error || 'Failed to publish camera');
  }

  const webrtcUrl = publishResp.webrtc;
  if (!webrtcUrl) throw new Error('No WebRTC URL returned');

  // 2) Create RTCPeerConnection and prepare to receive remote tracks
  const pc = new RTCPeerConnection(rtcConfig);
  pc.ontrack = (ev) => {
    // Attach first stream to video element
    if (videoElement) {
      videoElement.srcObject = ev.streams[0];
      videoElement.play().catch(() => {});
    }
  };

  // Add recvonly transceivers to ensure server sends media
  try {
    pc.addTransceiver('video', { direction: 'recvonly' });
    pc.addTransceiver('audio', { direction: 'recvonly' });
  } catch (e) {}

  // 3) Create SDP offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // 4) Wait for ICE gathering to finish (so offer contains candidates)
  await waitForIceGatheringComplete(pc);

  // 5) POST offer.sdp to MediaMTX WHEP endpoint (expects application/sdp body)
  const sdpOffer = pc.localDescription.sdp;
  const resp = await fetch(webrtcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: sdpOffer,
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    throw new Error(`WHEP handshake failed: ${resp.status} ${txt}`);
  }

  const answerSDP = await resp.text();
  await pc.setRemoteDescription({ type: 'answer', sdp: answerSDP });

  return pc;
}

export function stopWebRTCStream(pc, videoElement) {
  try { pc.close(); } catch (e) {}
  if (videoElement) {
    try { videoElement.srcObject = null; } catch (e) {}
  }
}

export default { startWebRTCStream, stopWebRTCStream };
