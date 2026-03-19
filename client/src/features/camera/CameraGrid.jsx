import React, { useEffect, useState } from 'react';
import VideoFeed from './VideoFeed.jsx';
import TodayReport from '../dashboard/TodayReport.jsx';
import { useCameraSocket } from '../../hooks/useCamera.js';
import { FaPlug, FaSpinner, FaVideo } from 'react-icons/fa';
import { FiAlertTriangle } from 'react-icons/fi';
import { fetchCameraList } from '../../services/apiService.js';

export default function CameraGrid() {
  const { cameraData, incidents, alerts, isConnected } = useCameraSocket();

  const [cameraList, setCameraList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [focusedCameraId, setFocusedCameraId] = useState(null);
  const [publishedCameras, setPublishedCameras] = useState(() => {
    try {
      const stored = localStorage.getItem('publishedCameras');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

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

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem('publishedCameras');
        setPublishedCameras(stored ? new Set(JSON.parse(stored)) : new Set());
      } catch (e) {
        console.error('Error loading publishedCameras from localStorage:', e);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const publishedCameraList = cameraList.filter(cam => publishedCameras.has(cam.id));
  const focusedCamera = publishedCameraList.find((c) => c.id === focusedCameraId);

  const HLS_BASE_URL =
    import.meta.env.VITE_MEDIAMTX_HLS_BASE_URL || 'http://127.0.0.1:8888';
  const WEBRTC_BASE_URL =
    import.meta.env.VITE_MEDIAMTX_WEBRTC_BASE_URL || 'http://127.0.0.1:8889';

  const getStreamPath = (camera) => camera.stream_path || camera.path || `cam${camera.id}`;
  const getHlsUrl = (camera) => `${HLS_BASE_URL}/${getStreamPath(camera)}/index.m3u8`;
  const getWebrtcUrl = (camera) => `${WEBRTC_BASE_URL}/${getStreamPath(camera)}/whep`;

  const header = (
    <div className="flex items-center text-2xl font-extrabold text-gray-900 mb-4 border-b pb-2">
      <FaVideo className="mr-3 text-gray-900" />
      Live View
      <span
        className={`ml-4 px-3 py-1 text-sm rounded-full font-semibold ${
          isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        <FaPlug className="inline-block mr-1" />
        {isConnected ? 'WebSocket Live' : 'WebSocket Disconnected'}
      </span>
    </div>
  );


  if (isLoading && cameraList.length === 0) {
    return (
      <div className="p-6">
        {header}
        <div className="flex items-center justify-center p-12 text-xl text-gray-700">
          <FaSpinner className="animate-spin mr-2" /> Loading camera configurations...
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
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {focusedCameraId && focusedCamera ? (
        <div className="flex-grow w-full">
          {header}
          <VideoFeed
            key={focusedCamera.id}
            camId={focusedCamera.id}
            location={focusedCamera.location_name || focusedCamera.location || focusedCamera.loc_name}
            streamUrl={getHlsUrl(focusedCamera)}
            webrtcUrl={getWebrtcUrl(focusedCamera)}
            frameData={cameraData[focusedCamera.id]}
            isConnected={isConnected}
            isFocused={true}
            onFocusChange={setFocusedCameraId}
          />
          <button
            onClick={() => setFocusedCameraId(null)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Back to Grid
          </button>
        </div>
      ) : (
        <>
          <div className="flex-grow lg:w-3/4">
            {header}
            {!isLoading && publishedCameraList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {publishedCameraList.map((camera) => (
                  <div key={camera.id} className={publishedCameraList.length === 1 ? 'md:col-span-2' : ''}>
                    <VideoFeed
                      camId={camera.id}
                      location={camera.location_name || camera.location || camera.loc_name}
                      streamUrl={getHlsUrl(camera)}
                      webrtcUrl={getWebrtcUrl(camera)}
                      frameData={cameraData[camera.id]}
                      isConnected={isConnected}
                      isFocused={false}
                      onFocusChange={setFocusedCameraId}
                    />
                  </div>
                ))}
              </div>
            )}
            {!isLoading && publishedCameraList.length === 0 && cameraList.length > 0 && (
              <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-600">
                <p>No published cameras. Go to <strong>Management</strong> tab to publish cameras.</p>
              </div>
            )}
          </div>

          <div className="lg:w-1/4 lg:flex-shrink-0">
            <TodayReport incidents={incidents} alerts={alerts} />
          </div>
        </>
      )}
    </div>
  );
}