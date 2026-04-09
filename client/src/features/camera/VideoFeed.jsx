import React, { useState, useEffect, useRef, memo } from 'react';
import { FaExpand, FaTimes } from 'react-icons/fa';
import HLS from 'hls.js';

function VideoFeed({ camId, cameraName, location, isFocused, onFocusChange, streamUrl }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [noDisplay, setNoDisplay] = useState(() => {
    try { return localStorage.getItem(`camera_${camId}_no_display`) === '1'; } catch (e) { return false; }
  });

  const wrapperRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up HLS.js for HLS streams
  useEffect(() => {
    if (!streamUrl || !videoRef.current || !streamUrl.includes('.m3u8')) return;

    if (HLS.isSupported()) {
      const hls = new HLS({
        debug: false,
        enableWorker: true,
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(videoRef.current);
      hls.on(HLS.Events.MANIFEST_PARSED, () => {
        videoRef.current?.play().catch(err => console.log('Autoplay failed:', err));
      });

      return () => {
        hls.destroy();
      };
    } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback for native HLS support (Safari)
      videoRef.current.src = streamUrl;
      videoRef.current.play().catch(err => console.log('Autoplay failed:', err));
    }
  }, [streamUrl]);

  const cameraStatus = streamUrl ? 'online' : 'offline';

  let content = null;

  if (noDisplay) {
    content = (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">No display</div>
          <div className="text-sm text-gray-300">Stream configuration is invalid or media server unavailable.</div>
        </div>
      </div>
    );
  } else if (streamUrl) {
    // Use HLS video stream (supports both .m3u8 and regular video URLs)
    // if (streamUrl.includes('.m3u8') || streamUrl.includes('/hls/')) {
    //   // HLS stream managed by HLS.js
    //   content = (
    //     <video ref={videoRef} className="w-full h-full object-cover" muted playsInline controls />
    //   );
    // } else {
      // Regular video stream
      // content = (
      //   <video src={streamUrl} className="w-full h-full object-cover" autoPlay muted playsInline controls />
      // );s
      content = (
        <div>
          <img src={"http://192.168.2.72:3000/video_feed?ip=192.168.2.211&pass=agapai143&t=1775720354654"} className="w-full h-full object-cover" autoPlay muted playsInline controls />
        </div>
      );
    // }
  } else {
    // No stream available
    content = (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="text-2xl font-semibold mb-2">Stream Unavailable</div>
          <div className="text-sm text-gray-300">No stream URL configured for this camera.</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className={`group bg-black rounded-none shadow-md overflow-hidden border-2 border-gray-700 relative ${!isFocused ? 'cursor-pointer hover:border-teal-500 transition-all' : 'border-teal-600'}`} onClick={() => !isFocused && onFocusChange?.(camId)}>
      <div className="absolute top-0 left-0 w-full text-white p-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <h4 className="font-semibold text-sm truncate">{cameraName}11234567890-80798675</h4>
          <p className="text-xs text-gray-400 truncate font-normal">{location}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${cameraStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </div>
      </div>

      <div className={`w-full bg-gray-900 flex items-center justify-center relative ${isFocused ? '' : 'aspect-video'}`} style={isFocused ? { width: '100%', height: 'calc(100vh - 6rem)', maxHeight: 'calc(100vh - 6rem)' } : {}}>
        {(!noDisplay && cameraStatus !== 'online') && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 text-white">
            <div className="text-lg font-semibold mb-2">{cameraStatus === 'online' ? 'Online' : 'Offline'}</div>
            <div className="w-8 h-8 border-4 border-t-transparent border-yellow-400 rounded-full animate-spin mb-2" />
          </div>
        )}

        {content}

        <div className="absolute bottom-2 left-2 bg-transparent text-white px-3 py-1 rounded text-xs font-mono">
          <div>DATE: {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString()}</div>
        </div>

        {isFocused ? (
          <button onClick={(e) => { e.stopPropagation(); onFocusChange?.(null); }} className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors z-20" title="Return to Grid"><FaTimes /></button>
        ) : (
          <div className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-20" title="Focus"><FaExpand /></div>
        )}
      </div>
    </div>
  );
}

export default memo(VideoFeed);
