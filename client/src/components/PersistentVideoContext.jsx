import React, { createContext, useState, useEffect, useRef } from 'react';

export const PersistentVideoContext = createContext();

/**
 * Maintains a persistent MJPEG stream connection that survives page navigation.
 * The stream stays alive even when hidden, so switching tabs doesn't restart the RTSP connection.
 */
export function PersistentVideoProvider({ children }) {
  const [streamUrl, setStreamUrl] = useState(null);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Load the stream URL whenever it changes
  useEffect(() => {
    if (!streamUrl) return;

    // Update the <img> src to start/restart the stream
    if (imgRef.current) {
      imgRef.current.src = streamUrl;
      imgRef.current.onload = () => setIsStreamReady(true);
      imgRef.current.onerror = () => setIsStreamReady(false);
    }
  }, [streamUrl]);

  return (
    <PersistentVideoContext.Provider value={{ streamUrl, setStreamUrl, isStreamReady }}>
      {/* Hidden container that maintains the MJPEG stream connection */}
      {/* This stays mounted even when MainPage is not visible */}
      <div ref={containerRef} style={{ display: 'none' }}>
        <img
          ref={imgRef}
          alt="Persistent video stream"
          style={{ display: 'none' }}
        />
      </div>

      {children}
    </PersistentVideoContext.Provider>
  );
}
