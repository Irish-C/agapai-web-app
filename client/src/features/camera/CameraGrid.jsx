import React, { useEffect, useState, useCallback, useContext } from 'react';
import VideoFeed from './VideoFeed.jsx';
import TodayReport from '../dashboard/TodayReport.jsx';
import { useCameraSocket } from '../../hooks/useCamera.js';
import { FaSpinner, FaVideo, FaSync, FaEthernet, FaUsb } from 'react-icons/fa';
import { fetchCameraConfig } from '../../services/apiService.js';
import { PersistentVideoContext } from '../../components/PersistentVideoContext.jsx';

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
function getVideoFeedUrl(streamUrl) {
  const parsed = parseRtspUrl(streamUrl);
  if (parsed) {
    return `http://localhost:3000/video_feed?ip=${parsed.ip}&pass=${parsed.password}&camera_id=1&t=${new Date().getTime()}`;
  }
  return null;
}

export default function CameraGrid() {
  const { alerts, isConnected } = useCameraSocket();
  const { setStreamUrl } = useContext(PersistentVideoContext);

  const [camera, setCamera] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraStatus, setCameraStatus] = useState(null);
  const [hardwareStatus, setHardwareStatus] = useState(null);

  // Poll camera stream health
  useEffect(() => {
    let mounted = true;
    const pollCamera = async () => {
      try {
        const resp = await fetch('http://localhost:5000/api/stream_health');
        if (!resp.ok) return;
        const data = await resp.json();
        if (mounted) setCameraStatus(data);
      } catch (e) {
        // ignore
      }
    };
    pollCamera();
    const interval = setInterval(pollCamera, 1000);
    return () => { 
      mounted = false; 
      clearInterval(interval);
    };
  }, []);

  // Poll hardware (ESP32) health
  useEffect(() => {
    let mounted = true;
    const pollHardware = async () => {
      try {
        const resp = await fetch('http://localhost:5000/api/hardware_health');
        if (!resp.ok) return;
        const data = await resp.json();
        if (mounted) setHardwareStatus(data);
      } catch (e) {
        // ignore
      }
    };
    pollHardware();
    const interval = setInterval(pollHardware, 1000);
    return () => { 
      mounted = false; 
      clearInterval(interval);
    };
  }, []);

  // Fetch single camera configuration
  useEffect(() => {
    let mounted = true;

    const getCamera = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchCameraConfig();
        if (!mounted) return;

        if (data && data.id) {
          setCamera(data);
          // Update persistent video context so stream survives page navigation
          const videoUrl = getVideoFeedUrl(data.stream_url);
          setStreamUrl(videoUrl);
        } else {
          setError('Camera configuration not found.');
        }
      } catch (err) {
        if (!mounted) return;
        setError(`Failed to load camera: ${err?.message || 'Unknown error'}`);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    getCamera();
    return () => {
      mounted = false;
    };
  }, [setStreamUrl]);

  // Refresh camera function
  const refreshCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCameraConfig();
      if (data && data.id) {
        setCamera(data);
        // Update persistent video context
        const videoUrl = getVideoFeedUrl(data.stream_url);
        setStreamUrl(videoUrl);
      } else {
        setError('Camera configuration not found.');
      }
    } catch (err) {
      setError(`Failed to load camera: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [setStreamUrl]);

  const header = (
    <div className="flex items-center justify-between mb-4 pb-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center text-2xl font-extrabold text-gray-900">
          <FaVideo className="mr-3 text-gray-900" />
          Live View
        </div>
        
        {/* Connection Indicators */}
        <div className="flex items-center gap-3 ml-2">
          {/* LAN Indicator */}
          <div className="flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold"
               title={`Camera: ${cameraStatus?.connected ? 'Connected' : 'Offline'}`}>
            <FaEthernet className={cameraStatus?.connected ? 'text-green-600' : 'text-red-600'} />
            <span className={cameraStatus?.connected ? 'text-green-700' : 'text-red-700'}>
              {cameraStatus?.connected ? 'LAN ACTIVE' : 'LAN FAILED'}
            </span>
          </div>

          {/* USB Indicator */}
          <div className="flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold"
               title={`Hardware: ${hardwareStatus?.connected ? 'Connected' : 'Offline'}`}>
            <FaUsb className={hardwareStatus?.connected ? 'text-green-600' : 'text-red-600'} />
            <span className={hardwareStatus?.connected ? 'text-green-700' : 'text-red-700'}>
              {hardwareStatus?.connected ? 'USB ACTIVE' : 'USB FAILED'}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={refreshCamera}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-cyan-800 text-white hover:bg-gray-500'
          }`}
          title="Refresh camera"
        >
          <FaSync className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </div>
  );

  // Connection status indicators in header

  if (isLoading) {
    return (
      <div className="p-6">
        {header}
        <div className="flex items-center justify-center p-12 text-xl text-gray-700">
          <FaSpinner className="animate-spin mr-2" /> Loading camera ...
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
    <div className="flex flex-col flex-row gap-4 p-4">
      <div className="flex-grow w-3/5">
        {header}
        {camera && (
          <div>
            <VideoFeed
              camId={1}
              cameraName={camera.name}
              streamUrl={getVideoFeedUrl(camera.stream_url)}
              rtspUrl={camera.stream_url}
              location={camera.location_name}
            />
          </div>
        )}
      </div>

      <div className="w-1/5 flex-shrink-0">
        <TodayReport incidents={alerts} alerts={alerts} />
      </div>
    </div>
  );
}