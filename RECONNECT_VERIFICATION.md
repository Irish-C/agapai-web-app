# Auto-Reconnect + Auto-Sync - Quick Verification Guide

## What Was Implemented

### 1. Backend Changes
**File**: `server/src/controllers/event_controller.py`
- New function: `get_missed_alerts_logic(timestamp_ms)`
  - Queries eventlog since timestamp
  - Returns alerts in Socket.IO format
  - Handles timezone conversion

**File**: `server/src/routes/event_routes.py`
- New import: `get_missed_alerts_logic`
- New endpoint: `GET /api/alerts/missed/{timestamp_ms}`
  - Returns JSON with missed alerts
  - Includes auth token in request
  - Accessible at: http://127.0.0.1:5000/api/alerts/missed/1710950000000

**File**: `server/app.py`
- Registered with @socketio_server.on('ping') handler
  - Responds with pong + timestamp
  - Health check support built-in

### 2. Frontend Changes

**File**: `client/src/services/socket.js`
- Subscription tracking (Set of camera IDs)
- Event buffering (array of events during disconnection)
- Exports:
  - `addSubscribedCamera(camId)`
  - `removeSubscribedCamera(camId)`
  - `addEventToBuffer(type, data)`
  - `registerOnBufferFlush(callback)`
  - `fetchMissedAlerts()` (internal)
  - `resubscribeToAllCameras()` (internal)
  - `forceReconnect()`, `startSocketHealthCheck()`
- Auto-reconnect flow:
  - On 'connect': re-subscribe + fetch missed alerts
  - On 'disconnect': enable buffering
  - Network online event: force immediate reconnect

**File**: `client/src/features/camera/VideoFeed.jsx`
- Imports: `addSubscribedCamera`, `removeSubscribedCamera`
- On mount: calls `addSubscribedCamera(camId)`
- On unmount: calls `removeSubscribedCamera(camId)`
- Camera subscriptions tracked globally

**File**: `client/src/hooks/useCamera.js`
- Imports: `addEventToBuffer`
- Added: `seenAlertIdsRef` to track seen alert IDs
- Deduplication: skip alerts already processed
- Event buffering: calls `addEventToBuffer` for new alerts
- Handles connect/disconnect lifecycle

**File**: `client/App.jsx`
- Imports: `registerOnBufferFlush`, `unregisterOnBufferFlush`
- New handler: `handleBufferFlush(missedAlerts)`
- Registered callback for buffer flush
- Displays most recent missed alert in UI

---

## Verification Checklist

### Step 1: Backend Endpoint
```bash
# In terminal, verify that the endpoint exists:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://127.0.0.1:5000/api/alerts/missed/1710950000000

# Should return:
# {
#   "status": "success",
#   "count": 0,
#   "alerts": []
# }
```

### Step 2: View Console During Connection
1. Open DevTools (F12)
2. Filter console by: `[SocketIO`
3. Should see:
   ```
   [SocketIO] Connected { transport: 'polling' }
   [SocketIO Health] Sending ping...
   [SocketIO Health] Pong received { latency: XX ms }
   [SocketIO Subscriptions] Added camera: 19
   [SocketIO Subscriptions] Added camera: 20
   ```

### Step 3: Test WiFi → Ethernet Switch
1. Verify connected with green 🟢 dot
2. Disconnect WiFi (or switch to ethernet)
3. Within 5-15 seconds should see:
   ```
   [SocketIO] Disconnected { reason: 'transport close' }
   [SocketIO Reconnect] Re-subscribing to 2 cameras
   [SocketIO Reconnect] Fetching alerts since 2026-03-20T00:00:XX.XXXZ
   [SocketIO Reconnect] Synced 0 missed alerts
   [SocketIO] Connected
   ```
4. Status should change: 🟡 Reconnecting... → 🟢 Connected

### Step 4: Test Missed Alerts Sync
1. Open two browser windows
2. Window 1: Watch camera feed
3. Window 2: Trigger a YOLO detection (if system has test mechanism)
4. In Window 1: Disconnect network
5. In Window 2: Trigger another detection while Window 1 is offline
6. In Window 1: Reconnect network
7. Should see in console:
   ```
   [SocketIO Reconnect] Synced 1 missed alerts
   📡 SYNCED MISSED ALERTS: 1 alerts
     - Syncing missed alert: Fall at 2026-03-20T00:00:XX.XXXZ
   ```

### Step 5: Test Event Buffering
1. Open DevTools, filter by: `Buffer`
2. Should see during normal operation:
   ```
   [SocketIO Buffer] Buffered event: camera_frame 1
   [SocketIO Buffer] Buffered event: new_alert 1
   ```
3. Actually, only appears during disconnection:
   ```
   [SocketIO] Event buffering enabled - will sync on reconnect
   [SocketIO Buffer] Buffered event: camera_frame 1
   ```

### Step 6: Test Zombie Detection (Optional, takes 25+ seconds)
1. Open DevTools, filter by: `[SocketIO Health`
2. Network should be working (see pongs)
3. Simulate network break: disable WiFi while keeping socket "alive"
4. Wait 25+ seconds
5. Should see:
   ```
   [SocketIO Health] Sending ping...
   [SocketIO Health] Sending ping...
   [SocketIO Health] Sending ping...
   (no pong responses for 25+ seconds)
   [SocketIO Health] ZOMBIE DETECTED: No pong in 25s, killing connection
   [SocketIO] Force reconnecting: killing current connection
   [SocketIO] Reconnect attempt 1
   [SocketIO] Connected
   ```

---

## Expected Behavior Summary

| Scenario | Duration | Status | Result |
|----------|----------|--------|--------|
| Normal operation | N/A | 🟢 Connected | Pings every 15s |
| Network glitch | 0-5s | 🟡 Reconnecting | Auto-recovers |
| WiFi→LAN switch | 0-15s | 🟡 → 🟢 | Force reconnect triggers |
| Network down | 0-30s | 🟡 Reconnecting | Exponential backoff retry |
| Network down | 30s+ | 🔴 Disconnected | Forced logout |
| Zombie connection | 25s+ | 🔴 Disconnected | Detected & killed |
| Long offline + YOLO | 0-30s | 🟡 → 🟢 + sync | Missed alerts fetched & shown |

---

## Console Log Quick Reference

### Successful Reconnection
```
[SocketIO] Disconnected { reason: 'transport close' }
[SocketIO] Event buffering enabled - will sync on reconnect
[SocketIO] Network online detected - forcing immediate reconnect
[SocketIO] Reconnect attempt 1
[SocketIO] Connected { transport: 'polling' }
[SocketIO Reconnect] Re-subscribing to 2 cameras
[SocketIO Reconnect] Syncing missed YOLO detections...
[SocketIO Reconnect] Synced 3 missed alerts
📡 SYNCED MISSED ALERTS: 3 alerts
```

### Zombie Detection
```
[SocketIO Health] Sending ping...
[SocketIO Health] Sending ping...
(no pong for 25+ seconds)
[SocketIO Health] ZOMBIE DETECTED: No pong in 25s, killing connection
[SocketIO] Force reconnecting: killing current connection
[SocketIO] Disconnected { reason: 'noop' }
[SocketIO] Reconnect attempt 1
[SocketIO] Connected
```

### Event Buffering During Disconnect
```
[SocketIO] Disconnected
[SocketIO] Event buffering enabled - will sync on reconnect
[SocketIO Buffer] Buffered event: new_alert 1
[SocketIO Buffer] Buffered event: camera_frame 2
(reconnection happens)
[SocketIO] Connected
[SocketIO Buffer] Cleared event buffer
```

---

## Configuration Adjustments

If reconnection is too slow:
```javascript
// In socket.js, line 28-31:
reconnectionDelay: 200,      // Start faster
reconnectionDelayMax: 15000, // Cap sooner
pollInterval: isDev ? 200 : 500, // Poll more frequently
```

If zombie detection is too aggressive:
```javascript
// In socket.js, line 14-16:
const HEALTH_CHECK_INTERVAL = 20000;        // Check every 20s instead of 15s
const HEALTH_CHECK_TIMEOUT = 8000;          // Wait 8s instead of 5s
const ZOMBIE_DETECTION_TIMEOUT = 35000;     // Kill at 35s instead of 25s
```

If logout is too fast:
```javascript
// In ConnectionStatus.jsx, line 36:
setTimeout(() => {
  /* logout after X seconds */
}, 45000);  // Changed from 30000 to 45 seconds
```

---

## Deployment Checklist

- [ ] Backend changes deployed (`event_controller.py`, `event_routes.py`)
- [ ] Frontend socket.js updated
- [ ] VideoFeed.jsx imports subscription functions
- [ ] useCamera.js handles deduplication
- [ ] App.jsx registers buffer flush callback
- [ ] Database has eventlog table indexed on timestamp
- [ ] Auth token handling verified (for `/api/alerts/missed/` calls)
- [ ] CORS allows cross-origin requests if needed
- [ ] All console logs working in production mode
- [ ] Load test: many concurrent reconnections

---

## FAQ

**Q: What if missed alerts are lost?**
A: Only in-memory buffers (few seconds). Historical alerts always available via `/api/event_logs`. For longer persistence, consider server-side event buffering.

**Q: Can a user see other users' alerts?**
A: No, `/api/alerts/missed/` is auth-protected. Query filters only return events for the authenticated user.

**Q: What's the maximum downtime handled?**
A: 30 seconds (forced logout). After that, user must login again. Network-level issues lasting longer should trigger manual admin intervention.

**Q: Does this work on mobile?**
A: Yes. Network changes (mobile to WiFi) trigger the `window.online` event. Reconnection behavior is identical to desktop.

**Q: What about production WebSocket?**
A: In production, Socket.IO uses WebSocket (not polling). Health checks still work. Network resilience even better (lower latency).

---

## Support

For issues:
1. Check console for `[SocketIO` logs
2. Verify backend endpoint: `curl http://127.0.0.1:5000/api/alerts/missed/1710950000000`
3. Check database: `SELECT COUNT(*) FROM eventlog WHERE timestamp > NOW() - INTERVAL 5 minutes;`
4. Verify auth token is being sent with API request
