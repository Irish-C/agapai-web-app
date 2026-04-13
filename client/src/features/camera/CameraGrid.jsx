import React, { useEffect, useState, useMemo, useCallback } from 'react';
import VideoFeed from './VideoFeed.jsx';
import { fetchApi } from '../../services/apiService.js';
import TodayReport from '../dashboard/TodayReport.jsx';
import { useCameraSocket } from '../../hooks/useCamera.js';
import { FaSpinner, FaVideo, FaSync } from 'react-icons/fa';
import { fetchCameraList } from '../../services/apiService.js';

// Helper: Extract IP and password from RTSP URL
// rtsp://admin:password@192.168.2.211/cam/realmonitor?channel=1&subtype=1
function parseRtspUrl(rtspUrl) {
  try {
    const url = new URL(rtspUrl.replace('rtsp://', 'http://'));
    const ip = url.hostname;
    const password = url.password;
    if (ip && password) {
      return { ip, password };
    }
  } catch (e) {
    console.warn('[CameraGrid] Failed to parse RTSP URL:', rtspUrl, e);
  }
  return null;
}

// Helper: Construct direct Flask video feed URL
function getVideoFeedUrl(streamUrl, cameraId = null) {
  const parsed = parseRtspUrl(streamUrl);
  if (parsed) {
    let url = `http://localhost:3000/video_feed?ip=${parsed.ip}&pass=${parsed.password}`;
    if (cameraId) {
      url += `&camera_id=${cameraId}`;
    }
    return url;
  }
  return null;
}

export default function CameraGrid() {
  const { cameraData, alerts, isConnected } = useCameraSocket();

  const [cameraList, setCameraList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusedCameraId, setFocusedCameraId] = useState(null);
  const [mediamtxHealth, setMediamtxHealth] = useState(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const resp = await fetch('/mediamtx_health');
        if (!resp.ok) return;
        const j = await resp.json();
        if (!mounted) return;
        setMediamtxHealth(j);
      } catch (e) {
        // ignore
      }
    };
    check();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    const getCameras = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCameraList();
        if (!mounted) return;

        if (data?.status === 'success' && Array.isArray(data.cameras)) {
          setCameraList(data.cameras);
        } else {
          setError('API did not return a valid camera list.');
        }
      } catch (err) {
        if (!mounted) return;
        setError(`Failed to load camera list: ${err?.message || 'Unknown error'}`);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    getCameras();
    return () => {
      mounted = false;
    };
  }, []);



  // All cameras become visible automatically (no publish step needed)
  const visibleCameraList = useMemo(
    () => cameraList,
    [cameraList]
  );
  
  // Memoize focusedCamera to prevent VideoFeed remounting when incidents change
  const focusedCamera = useMemo(
    () => visibleCameraList.find((c) => c.id === focusedCameraId),
    [visibleCameraList, focusedCameraId]
  );

  // Streaming URL generation removed; frontend will render placeholders only.
  const getStreamPath = (camera) => camera.stream_path || camera.path || `cam${camera.id}`;

  // Refresh cameras function
  const refreshCameras = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCameraList();
      if (data?.status === 'success' && Array.isArray(data.cameras)) {
        setCameraList(data.cameras);
      } else {
        setError('API did not return a valid camera list.');
      }
    } catch (err) {
      setError(`Failed to load camera list: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const header = (
    <div className="flex items-center justify-between mb-4 pb-2">
      <div className="flex items-center text-2xl font-extrabold text-gray-900">
        <FaVideo className="mr-3 text-gray-900" />
        Live View
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={refreshCameras}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-cyan-800 text-white hover:bg-gray-500'
          }`}
          title="Refresh all cameras"
        >
          <FaSync className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );

  const mediamtxBanner = mediamtxHealth && !mediamtxHealth.ok ? (
    <div className="p-3 mb-4 rounded bg-yellow-100 border border-yellow-300 text-yellow-800">
      <div className="font-semibold">MediaMTX connectivity issues</div>
      <ul className="text-sm">
        {mediamtxHealth.messages && mediamtxHealth.messages.map((m, i) => <li key={i}>- {m}</li>)}
      </ul>
    </div>
  ) : null;

  if (isLoading && cameraList.length === 0) {
    return (
      <div className="p-6">
        {header}
        <div className="flex items-center justify-center p-12 text-xl text-gray-700">
          <FaSpinner className="animate-spin mr-2" /> Loading streams ...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        {header}
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4">
      {focusedCameraId && focusedCamera ? (
        <div className="flex-grow w-full">
          {header}
          {(() => {
            // Handle focused camera streaming (direct from Flask AI service)
            const dynamicStreamUrl = getVideoFeedUrl(focusedCamera.stream_url, focusedCamera.id);
            
            console.log(`[CameraGrid] [STREAM] Focused camera ${focusedCamera.id}: ${dynamicStreamUrl}`);
            return (
              <VideoFeed
                key={focusedCamera.id}
                camId={focusedCamera.id}
                cameraName={focusedCamera.name}
                streamUrl={dynamicStreamUrl}
                rtspUrl={focusedCamera.stream_url}
                location={focusedCamera.location_name || focusedCamera.location || focusedCamera.loc_name}
                isFocused={true}
                onFocusChange={setFocusedCameraId}
              />
            );
          })()}
        </div>
      ) : (
        <>
          <div className="flex-grow lg:w-3/4">
            {header}
            {!isLoading && visibleCameraList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                {visibleCameraList.map((camera) => {
                  const location = camera.location_name || camera.location || camera.loc_name;
                  
                  // Determine stream URL for direct Flask video feed
                  const dynamicStreamUrl = getVideoFeedUrl(camera.stream_url, camera.id);
                  
                  console.log(`[CameraGrid] [STREAM] Grid camera ${camera.id}: ${dynamicStreamUrl}`);
                  return (
                    <div key={camera.id} className={visibleCameraList.length === 1 ? 'md:col-span-2' : ''}>
                      <VideoFeed
                        camId={camera.id}
                        cameraName={camera.name}
                        streamUrl={dynamicStreamUrl}
                        rtspUrl={camera.stream_url}
                        location={location}
                        isFocused={false}
                        onFocusChange={setFocusedCameraId}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            {!isLoading && visibleCameraList.length === 0 && (
              <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                <p>No cameras available. Go to <strong>Management</strong> tab to add cameras.</p>
              </div>
            )}
          </div>

          <div className="lg:w-1/4 lg:flex-shrink-0">
            <TodayReport incidents={alerts} alerts={alerts} />
          </div>
        </>
      )}
    </div>
  );
}