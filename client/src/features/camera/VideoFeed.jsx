import React, { useEffect, useRef, useState } from 'react';
import { socket } from '../../services/socket.js';
import Hls from 'hls.js';
import { FaExpand, FaTimes } from 'react-icons/fa';

export default function VideoFeed({
  camId,
  cameraName,
  location,
  streamUrl,   // HLS
  webrtcUrl,   // WHEP
  isFocused,
  onFocusChange
}) {
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const hlsRef = useRef(null);
  const retryTimerRef = useRef(null);

  const [mode, setMode] = useState('webrtc'); // webrtc | hls
  const [status, setStatus] = useState('Connecting...');

  const [webrtcDebug, setWebrtcDebug] = useState({
    url: '',
    status: null,
    body: '',
    error: null,
  });
  const [showDebug, setShowDebug] = useState(false);

  const clearAll = () => {
    try {
      if (socket && socket.connected) {
        socket.emit('unsubscribe_camera', { camera_id: camId });
      }
    } catch (e) {}
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.removeAttribute('src');
    }
  };

  const startHls = () => {
    clearAll();
    if (!videoRef.current || !streamUrl) return;
    const v = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true, backBufferLength: 10 });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(v);
    } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
      v.src = streamUrl;
    }

    setMode('hls');
    setStatus('HLS fallback');
  };

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;

    const connectWebRTC = async () => {
      if (cancelled || !videoRef.current || !webrtcUrl) return;

      try {
        clearAll();
        setMode('webrtc');
        setStatus('Connecting WebRTC...');

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pcRef.current = pc;

        pc.addTransceiver('video', { direction: 'recvonly' });
        pc.addTransceiver('audio', { direction: 'recvonly' });

        pc.ontrack = (e) => {
          if (!videoRef.current) return;
          videoRef.current.srcObject = e.streams[0];
          setStatus('Live (WebRTC)');
        };

        pc.onconnectionstatechange = () => {
          const s = pc.connectionState;
          if (s === 'failed' || s === 'disconnected' || s === 'closed') {
            if (cancelled || mode !== 'webrtc') return;
            const delay = Math.min(1000 * (2 ** attempt), 8000);
            attempt += 1;
            if (attempt >= 3) {
              setStatus('WebRTC unavailable, falling back to HLS...');
              setMode('hls');
              return;
            }
            setStatus(`Reconnecting WebRTC in ${Math.round(delay / 1000)}s...`);
            retryTimerRef.current = setTimeout(connectWebRTC, delay);
          }
        };

        // Subscribe this client to the camera room so the server only emits
        // frames to viewers who requested this camera.
        try {
          socket.emit('subscribe_camera', { camera_id: camId });
        } catch (e) {}

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.debug('[WebRTC] POST WHEP', webrtcUrl);
        setWebrtcDebug((prev) => ({ ...prev, url: webrtcUrl, status: null, body: '', error: null }));

        const res = await fetch(webrtcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: pc.localDescription?.sdp || ''
        });

        const body = await res.text();
        console.debug('[WebRTC] WHEP response', res.status, body);
        setWebrtcDebug((prev) => ({ ...prev, status: res.status, body }));

        if (!res.ok) {
          // Attach body for better debugging
          setWebrtcDebug((prev) => ({ ...prev, error: `WHEP ${res.status}: ${body}` }));
          throw new Error(`WHEP ${res.status}: ${body}`);
        }

        await pc.setRemoteDescription({ type: 'answer', sdp: body });

        attempt = 0;
      } catch (err) {
        if (cancelled || mode !== 'webrtc') return;
        setWebrtcDebug((prev) => ({ ...prev, error: err.message || String(err) }));
        const delay = Math.min(1000 * (2 ** attempt), 8000);
        attempt += 1;
        if (attempt >= 3) {
          setStatus('WebRTC unavailable, falling back to HLS...');
          setMode('hls');
          return;
        }
        setStatus(`WebRTC failed. Retrying in ${Math.round(delay / 1000)}s...`);
        retryTimerRef.current = setTimeout(connectWebRTC, delay);
      }
    };

    if (mode === 'webrtc') connectWebRTC();
    else startHls();

    return () => {
      cancelled = true;
      // Ensure we unsubscribe when component unmounts
      try {
        if (socket && socket.connected) {
          socket.emit('unsubscribe_camera', { camera_id: camId });
        }
      } catch (e) {}
      clearAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camId, webrtcUrl, streamUrl, mode]);

  return (
    <div
      className={`group bg-black rounded-lg shadow-lg overflow-hidden border-2 border-gray-700 relative ${
        !isFocused ? 'cursor-pointer hover:border-teal-500 transition-all' : 'border-teal-600'
      }`}
      onClick={() => !isFocused && onFocusChange?.(camId)}
    >
      <div className="bg-gray-800 text-white p-2 flex items-center justify-between">
        <div className="flex flex-col overflow-hidden">
          <h4 className="font-semibold text-sm truncate">{cameraName}</h4>
          <p className="text-xs text-gray-400 truncate">{location}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-300">{status}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDebug((prev) => !prev);
            }}
            className="text-[10px] uppercase tracking-wide text-gray-300 hover:text-white px-2 py-1 border border-gray-600 rounded"
            title="Toggle WebRTC debug info"
          >
            debug
          </button>
        </div>
      </div>

      <div className={`w-full bg-gray-900 flex items-center justify-center relative ${isFocused ? 'h-[75vh]' : 'aspect-video'}`}>
        <video ref={videoRef} autoPlay muted playsInline controls className="w-full h-full object-contain" />

        <div className="absolute left-2 top-2 flex gap-2">
          {mode === 'webrtc' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMode('hls');
              }}
              className="px-2 py-1 text-xs bg-black/60 text-white rounded"
              title="Use HLS fallback"
            >
              Use HLS
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMode('webrtc');
              }}
              className="px-2 py-1 text-xs bg-black/60 text-white rounded"
              title="Return to WebRTC"
            >
              Use WebRTC
            </button>
          )}
        </div>

        {showDebug ? (
          <div className="absolute bottom-4 left-4 right-4 bg-black/80 text-white rounded-lg p-3 text-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-semibold mb-1">WebRTC Debug</div>
                <div className="text-[11px] text-gray-300">URL: <span className="text-white break-all">{webrtcDebug.url || '—'}</span></div>
                <div className="text-[11px] text-gray-300">Status: <span className="text-white">{webrtcDebug.status ?? '—'}</span></div>
                <div className="text-[11px] text-gray-300">Error: <span className="text-white">{webrtcDebug.error || '—'}</span></div>
                <div className="text-[11px] text-gray-300">Body preview:</div>
                <pre className="max-h-28 overflow-y-auto bg-black/50 p-2 rounded text-[10px] whitespace-pre-wrap">{webrtcDebug.body || '—'}</pre>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDebug(false);
                }}
                className="text-sm px-2 py-1 bg-white/10 rounded text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}

        {isFocused ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFocusChange?.(null);
            }}
            className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"
            title="Return to Grid"
          >
            <FaTimes />
          </button>
        ) : (
          <div className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <FaExpand />
          </div>
        )}
      </div>
    </div>
  );
}