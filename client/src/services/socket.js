// client/src/services/socket.js
import { io } from "socket.io-client";

// Stable server configuration
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:5000";
const isDev = import.meta.env.DEV;
const transports = isDev ? ["polling"] : ["websocket"];

// Socket health check configuration
const HEALTH_CHECK_INTERVAL = 15000; // Check every 15 seconds
const HEALTH_CHECK_TIMEOUT = 5000; // Wait 5 seconds for pong response
const ZOMBIE_DETECTION_TIMEOUT = 25000; // 25 seconds without pong = zombie

// Track socket health state
let healthCheckIntervalId = null;
let lastPongTime = Date.now();
let isPingPending = false;

// ============================================
// SUBSCRIPTION & BUFFERING STATE
// ============================================
const subscriptionState = {
  subscribedCameras: new Set(), // Track which cameras are subscribed
  eventBuffer: [], // Buffer events during disconnection
  lastSyncTime: Date.now(), // Track last sync to fetch missed alerts
  isBuffering: false, // Are we currently buffering (disconnected)?
};

// Callbacks for when buffer is flushed
let onBufferFlushCallbacks = [];

export const socket = io(SOCKET_URL, {
  transports,
  upgrade: false,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 300,
  reconnectionDelayMax: 20000,
  randomizationFactor: 0.3,
  timeout: isDev ? 60000 : 20000, // Dev poll is slower, allow 60s for connection attempt
  pollInterval: isDev ? 500 : 1000, // Reduced polling interval in dev for responsiveness
  pollTimeout: isDev ? 25000 : 5000, // Dev long polling needs more time (25s for stable connection)
});

// ============================================
// SUBSCRIPTION TRACKING
// ============================================
export function addSubscribedCamera(cameraId) {
  subscriptionState.subscribedCameras.add(cameraId);
  console.debug('[SocketIO Subscriptions] Added camera:', cameraId);
}

export function removeSubscribedCamera(cameraId) {
  subscriptionState.subscribedCameras.delete(cameraId);
  console.debug('[SocketIO Subscriptions] Removed camera:', cameraId);
}

export function getSubscribedCameras() {
  return Array.from(subscriptionState.subscribedCameras);
}

// ============================================
// EVENT BUFFERING
// ============================================
export function addEventToBuffer(eventType, data) {
  if (subscriptionState.isBuffering) {
    subscriptionState.eventBuffer.push({
      type: eventType,
      data,
      bufferedAt: Date.now(),
    });
    console.debug('[SocketIO Buffer] Buffered event:', eventType, subscriptionState.eventBuffer.length);
  }
}

export function getBufferedEvents() {
  return [...subscriptionState.eventBuffer];
}

export function clearEventBuffer() {
  subscriptionState.eventBuffer = [];
  console.debug('[SocketIO Buffer] Cleared event buffer');
}

export function registerOnBufferFlush(callback) {
  onBufferFlushCallbacks.push(callback);
}

export function unregisterOnBufferFlush(callback) {
  onBufferFlushCallbacks = onBufferFlushCallbacks.filter(cb => cb !== callback);
}

function notifyBufferFlush(alerts) {
  onBufferFlushCallbacks.forEach(cb => {
    try {
      cb(alerts);
    } catch (err) {
      console.error('[SocketIO Buffer] Error in flush callback:', err);
    }
  });
}

// ============================================
// AUTO-RESUBSCRIBE TO CAMERAS
// ============================================
async function resubscribeToAllCameras() {
  const cameras = getSubscribedCameras();
  console.log('[SocketIO Reconnect] Re-subscribing to', cameras.length, 'cameras');
  const authToken = localStorage.getItem('authToken');
  
  for (const cameraId of cameras) {
    try {
      socket.emit('subscribe_camera', { camera_id: cameraId, token: authToken });
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between subscriptions
    } catch (err) {
      console.error('[SocketIO Reconnect] Failed to resubscribe to camera', cameraId, err);
    }
  }
}

// ============================================
// FETCH MISSED ALERTS (YOLO DETECTIONS)
// ============================================
async function fetchMissedAlerts() {
  try {
    const lastSync = subscriptionState.lastSyncTime;
    console.log('[SocketIO Reconnect] Fetching alerts since', new Date(lastSync).toISOString());
    
    const response = await fetch(`${SOCKET_URL}/api/alerts/missed/${lastSync}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Include auth token if available
        ...(localStorage.getItem('authToken') && {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        })
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.alerts && result.alerts.length > 0) {
      console.log('[SocketIO Reconnect] Synced', result.count, 'missed alerts');
      subscriptionState.lastSyncTime = Date.now();
      return result.alerts;
    }
    
    subscriptionState.lastSyncTime = Date.now();
    return [];
  } catch (err) {
    console.error('[SocketIO Reconnect] Failed to fetch missed alerts:', err);
    return [];
  }
}

// ============================================
// HEALTH CHECK SYSTEM (Zombie Detection)
// ============================================
export function startSocketHealthCheck() {
  if (healthCheckIntervalId) {
    clearInterval(healthCheckIntervalId);
  }

  healthCheckIntervalId = setInterval(() => {
    if (!socket.connected) return;

    if (isPingPending && Date.now() - lastPongTime > ZOMBIE_DETECTION_TIMEOUT) {
      console.warn('[SocketIO Health] ZOMBIE DETECTED: No pong in 25s, killing connection');
      forceReconnect();
      return;
    }

    if (!isPingPending) {
      console.debug('[SocketIO Health] Sending ping...');
      isPingPending = true;
      socket.emit('ping', { timestamp: Date.now() });

      setTimeout(() => {
        if (isPingPending) {
          console.warn('[SocketIO Health] PONG TIMEOUT: No response in 5s, killing connection');
          isPingPending = false;
          forceReconnect();
        }
      }, HEALTH_CHECK_TIMEOUT);
    }
  }, HEALTH_CHECK_INTERVAL);
}

export function stopSocketHealthCheck() {
  if (healthCheckIntervalId) {
    clearInterval(healthCheckIntervalId);
    healthCheckIntervalId = null;
  }
}

// ============================================
// FORCE RECONNECT (Kill & Restart)
// ============================================
export function forceReconnect() {
  console.warn('[SocketIO] Force reconnecting: killing current connection');
  isPingPending = false;
  lastPongTime = Date.now();
  
  socket.disconnect();
  setTimeout(() => {
    socket.connect();
  }, 100);
}

// ============================================
// NETWORK CHANGE DETECTION
// ============================================
export function enableNetworkAwareReconnection() {
  window.addEventListener('online', () => {
    console.log('[SocketIO] Network online detected - forcing immediate reconnect');
    if (!socket.connected) {
      socket.connect();
    }
  });

  window.addEventListener('offline', () => {
    console.log('[SocketIO] Network offline detected');
  });
}

// ============================================
// PONG RESPONSE HANDLER
// ============================================
socket.on('pong', (data) => {
  if (isPingPending) {
    console.debug('[SocketIO Health] Pong received', { latency: Date.now() - data.timestamp });
    isPingPending = false;
    lastPongTime = Date.now();
  }
});

// ============================================
// CONNECTION LIFECYCLE WITH AUTO-SYNC
// ============================================
socket.on('connect', async () => {
  console.log('[SocketIO] Connected', {
    url: socket.io.uri,
    transport: socket.io.engine.transport.name,
  });
  
  lastPongTime = Date.now();
  isPingPending = false;
  
  // Stop buffering events now that we're connected
  const wasBuffering = subscriptionState.isBuffering;
  subscriptionState.isBuffering = false;
  
  // Start health checks
  startSocketHealthCheck();
  
  // Re-subscribe to all previously subscribed cameras
  await resubscribeToAllCameras();
  
  // Fetch missed alerts if we were disconnected
  if (wasBuffering) {
    console.log('[SocketIO Reconnect] Syncing missed YOLO detections...');
    const missedAlerts = await fetchMissedAlerts();
    
    // Notify that buffer is being flushed with missed alerts
    if (missedAlerts.length > 0) {
      notifyBufferFlush(missedAlerts);
    }
  }
});

socket.on('disconnect', (reason) => {
  console.log('[SocketIO] Disconnected', { reason });
  stopSocketHealthCheck();
  
  // Start buffering events during disconnection
  subscriptionState.isBuffering = true;
  subscriptionState.lastSyncTime = Date.now();
  console.log('[SocketIO] Event buffering enabled - will sync on reconnect');
});

socket.on('reconnect_attempt', (attempt) => {
  console.log('[SocketIO] Reconnect attempt', { attempt });
});

socket.on('reconnect_failed', () => {
  console.error('[SocketIO] Reconnect failed - will retry');
  stopSocketHealthCheck();
});

socket.on('connect_error', (err) => {
  console.error('[SocketIO] Connection error', err);
});

socket.on('connect_timeout', (timeout) => {
  console.error('[SocketIO] Connection timeout', { timeout });
});

// ============================================
// INITIALIZATION
// ============================================
enableNetworkAwareReconnection();

if (typeof io === 'undefined') {
  console.error("🚨 Socket.io client library failed to load!");
}