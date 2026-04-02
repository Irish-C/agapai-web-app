/**
 * Manages camera stream setup and teardown.
 * Handles WebRTC, HLS, and MJPEG stream modes.
 * 
 * @param {string} streamUrl - The stream URL (WHEP, .m3u8, or MJPEG)
 * @param {string|number} camId - Camera ID for logging
 * @returns {Object} { streamMode, videoRef, pcRef, hlsRef, status, setStatus }
 */
import { useState, useEffect, useRef } from 'react';

export function useCameraStream(streamUrl, camId) {
  const [streamMode, setStreamMode] = useState(null); // 'webrtc' | 'hls' | 'mjpeg'
  const [status, setStatus] = useState('connecting'); // 'connecting' | 'online' | 'offline' | 'error'
  const videoRef = useRef(null);
  const pcRef = useRef(null);
  const hlsRef = useRef(null);

  // Determine stream mode from streamUrl
  useEffect(() => {
    if (!streamUrl) {
      setStreamMode('mjpeg');
      setStatus('connecting');
      return;
    }

    try {
      const url = String(streamUrl);
      if (url.indexOf('/whep') !== -1 || url.toLowerCase().includes('webrtc')) {
        setStreamMode('webrtc');
        setStatus('connecting');
      } else if (url.endsWith('.m3u8')) {
        setStreamMode('hls');
        setStatus('connecting');
      } else {
        setStreamMode('mjpeg');
        setStatus('connecting');
      }
    } catch (e) {
      setStreamMode('mjpeg');
      setStatus('connecting');
    }
  }, [streamUrl]);

  // Ensure we listen for the video 'playing' event so status flips to 'online'
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlaying = () => {
      setStatus('online');
    };

    video.addEventListener('playing', handlePlaying);

    return () => {
      try { video.removeEventListener('playing', handlePlaying); } catch (e) {}
    };
  }, [videoRef]);

  // Setup and teardown streams based on mode
  useEffect(() => {
    let mounted = true;

    // Helper to attach status listeners to <video> element
    const attachVideoStatusListeners = (videoEl) => {
      if (!videoEl) return;
      // Remove previous listeners if any
      videoEl.onloadeddata = null;
      videoEl.onerror = null;
      videoEl.onstalled = null;
      videoEl.onwaiting = null;
      videoEl.onplaying = null;

      videoEl.onloadeddata = () => {
        if (mounted) setStatus('online');
      };
      videoEl.onplaying = () => {
        if (mounted) setStatus('online');
      };
      videoEl.onwaiting = () => {
        if (mounted) setStatus('connecting');
      };
      videoEl.onstalled = () => {
        if (mounted) setStatus('offline');
      };
      videoEl.onerror = () => {
        if (mounted) setStatus('error');
      };
    };

    const startWebRTC = async () => {
      if (!videoRef.current) return;
      setStatus('connecting');
      try {
        pcRef.current = await streamService.startWebRTCStream(camId, videoRef.current);
        attachVideoStatusListeners(videoRef.current);
      } catch (e) {
        console.error('[useCameraStream] WebRTC start failed, falling back to MJPEG/HLS:', e);
        if (mounted) {
          setStreamMode('mjpeg');
          setStatus('offline');
        }
      }
    };

    const startHLS = async () => {
      const v = videoRef.current;
      if (!v) return;
      setStatus('connecting');
      v.crossOrigin = 'anonymous';
      try {
        // If hls.js is available and supported, use it for most browsers
        const ensureHls = async () => {
          if (window.Hls) return window.Hls;
          // Load hls.js from CDN into the page
          await new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';
            s.async = true;
            s.onload = () => resolve();
            s.onerror = (e) => reject(new Error('Failed to load hls.js'));
            document.head.appendChild(s);
          });
          return window.Hls;
        };

        const HlsLib = await ensureHls();
        if (HlsLib && HlsLib.isSupported()) {
          // Destroy previous instance if any
          try { hlsRef.current?.destroy(); } catch (e) {}
          hlsRef.current = new HlsLib();
          hlsRef.current.loadSource(streamUrl);
          hlsRef.current.attachMedia(v);
          hlsRef.current.on(HlsLib.Events.ERROR, (event, data) => {
            console.error('[useCameraStream] HLS error', event, data);
            if (mounted) setStatus('error');
          });
          // autoplay if possible
          v.play().catch(() => {});
          attachVideoStatusListeners(v);
          return;
        }
      } catch (err) {
        console.warn('[useCameraStream] hls.js failed to initialize, falling back to native HLS', err);
      }

      // Fallback: set src directly (works on Safari/native HLS)
      v.src = streamUrl;
      v.play().catch(() => {});
      attachVideoStatusListeners(v);
    };

    if (streamMode === 'webrtc') {
      startWebRTC();
    } else if (streamMode === 'hls') {
      startHLS();
    }

    return () => {
      mounted = false;
      // Cleanup WebRTC
      if (pcRef.current) {
        try { streamService.stopWebRTCStream(pcRef.current, videoRef.current); } catch (e) {}
        pcRef.current = null;
      }
      // Stop HLS/video
      if (videoRef.current) {
        try { videoRef.current.pause(); videoRef.current.src = ''; } catch (e) {}
        try { hlsRef.current?.destroy(); hlsRef.current = null; } catch (e) {}
        // Remove listeners
        videoRef.current.onloadeddata = null;
        videoRef.current.onerror = null;
        videoRef.current.onstalled = null;
        videoRef.current.onwaiting = null;
        videoRef.current.onplaying = null;
      }
    };
  }, [streamMode, streamUrl, camId]);

  return {
    streamMode,
    videoRef,
    pcRef,
    hlsRef,
    status,
    setStatus,
  };
}