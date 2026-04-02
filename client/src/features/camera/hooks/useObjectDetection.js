import { useState, useEffect, useRef } from 'react';

/**
 * Manages object detection via continuous frame capture and /detect API calls.
 * Handles YOLO inference requests, deduplication, and result state.
 * 
 * @param {React.RefObject} videoRef - Reference to video element
 * @param {React.RefObject} wrapperRef - Reference to wrapper element (for canvas access in MJPEG mode)
 * @param {string} streamMode - 'webrtc' | 'hls' | 'mjpeg'
 * @param {boolean} noDisplay - Whether to skip detection (disabled camera)
 * @param {string|number} camId - Camera ID for logging
 * @returns {Object} { detections, lastDetectionAt, confidenceThreshold, setConfidenceThreshold }
 */
export function useObjectDetection(videoRef, wrapperRef, streamMode, noDisplay, camId) {
  const [detections, setDetections] = useState([]);
  const [lastDetectionAt, setLastDetectionAt] = useState(0);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  
  const detectInflightRef = useRef(false);
  const lastRequestTsRef = useRef(0);
  const lastResponseTsRef = useRef(0);

  // Capture loop: downscale, encode JPEG, POST to /detect. Single inflight request.
  useEffect(() => {
    let mounted = true;
    const INTERVAL = 200; // ms
    const MAX_LONG_SIDE = 640;

    const captureAndSend = async () => {
      if (!mounted) return;
      if (detectInflightRef.current) return; // only one inflight
      if (document.hidden) return; // don't run when tab hidden
      if (noDisplay) return; // skip when disabled
      if (streamMode === 'mjpeg') return; // skip MJPEG to avoid overhead

      const videoEl = videoRef.current;
      const container = wrapperRef.current;
      let sourceEl = null;
      if (videoEl && (streamMode === 'webrtc' || streamMode === 'hls')) {
        sourceEl = videoEl;
      } else if (container) {
        sourceEl = container.querySelector('canvas');
      }
      if (!sourceEl) return;

      const srcWidth = sourceEl.videoWidth || sourceEl.naturalWidth || sourceEl.width || sourceEl.offsetWidth;
      const srcHeight = sourceEl.videoHeight || sourceEl.naturalHeight || sourceEl.height || sourceEl.offsetHeight;
      if (!srcWidth || !srcHeight) return;

      // Compute scaled size keeping aspect ratio
      const longSide = Math.max(srcWidth, srcHeight);
      let outW = srcWidth;
      let outH = srcHeight;
      if (longSide > MAX_LONG_SIDE) {
        const scale = MAX_LONG_SIDE / longSide;
        outW = Math.round(srcWidth * scale);
        outH = Math.round(srcHeight * scale);
      }

      // Render to offscreen canvas
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = outW;
      captureCanvas.height = outH;
      const ctx = captureCanvas.getContext('2d');
      try {
        ctx.drawImage(sourceEl, 0, 0, outW, outH);
      } catch (e) {
        return;
      }

      // Encode to JPEG blob
      detectInflightRef.current = true;
      const reqTs = Date.now();
      lastRequestTsRef.current = reqTs;

      captureCanvas.toBlob(async (blob) => {
        if (!blob) { detectInflightRef.current = false; return; }
        try {
          const token = localStorage.getItem('authToken');
          const resp = await fetch('/detect', {
            method: 'POST',
            headers: {
              'Content-Type': 'image/jpeg',
              'X-Request-Ts': String(reqTs),
              'X-Source-Width': String(outW),
              'X-Source-Height': String(outH),
              ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
            body: blob,
          });
          if (resp && resp.ok) {
            try {
              const j = await resp.json();
              if (j && Array.isArray(j.detections)) {
                setDetections(j.detections);
                setLastDetectionAt(Date.now());
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        } catch (e) {
          // handle error
        } finally {
          detectInflightRef.current = false;
        }
      }, 'image/jpeg', 0.7);
    };

    const id = setInterval(captureAndSend, INTERVAL);
    return () => { mounted = false; clearInterval(id); };
  }, [streamMode, noDisplay, camId, videoRef, wrapperRef]);

  // Clear detections if no new results arrive within STALE_TIMEOUT
  useEffect(() => {
    const STALE_TIMEOUT = 2000; // ms
    if (!lastDetectionAt) return;
    const id = setTimeout(() => {
      setDetections([]);
    }, STALE_TIMEOUT);
    return () => clearTimeout(id);
  }, [lastDetectionAt]);

  return {
    detections,
    setDetections,
    lastDetectionAt,
    confidenceThreshold,
    setConfidenceThreshold,
  };
}
