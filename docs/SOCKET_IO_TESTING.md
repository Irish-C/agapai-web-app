# Socket.IO Aggressive Reconnection - Testing Guide

## System Overview

The Socket.IO reconnection system includes:
- **Zombie Connection Detection** (kills hanging connections after 25s)
- **Health Check Pings** (every 15s to backend)
- **Aggressive Reconnection** (300ms initial retry, 20s max backoff)
- **Network Change Detection** (automatic reconnect on WiFi↔LAN switch)
- **Manual Force Reconnect** (button appears after 15s disconnect)
- **30-Second Logout Grace Period** (prevents orphaned sessions)

---

## Test Scenarios

### Test 1: Normal Operation (Health Checks)
**Duration**: 2 minutes  
**Prerequisites**: Connected to WiFi/LAN

**Steps**:
1. Open browser DevTools Console (F12)
2. Look for recurring logs every 15 seconds:
   ```
   [SocketIO Health] Sending ping...
   [SocketIO Health] Pong received { latency: XX ms }
   ```
3. Verify green "Connected" status indicator in bottom-right

**Expected Results**:
- Pong latency < 100ms on same network
- Pings occur consistently every 15 seconds
- No reconnection attempts (stable connection)
- Status dot: 🟢 Green, pulsing

**Pass Criteria**: 5+ consecutive pings without error

---

### Test 2: WiFi → Ethernet Switch
**Duration**: 1 minute  
**Prerequisites**: WiFi connected, ethernet cable plugged in

**Steps**:
1. Verify status is "Connected" 🟢
2. Disconnect WiFi (or switch to ethernet)
3. Watch console for disconnect + reconnect logs
4. Verify status transitions: 🟡 Reconnecting... → 🟢 Connected
5. Check for pong resumption after reconnect

**Expected Results**:
- Disconnect detected within 1 second
- Status changes to yellow "Reconnecting..."
- Reconnection occurs within 5-15 seconds
- Console shows successful pong after reconnect
- No forced logout

**Pass Criteria**: Reconnect < 15s without manual intervention

**Console Expected Output**:
```
[SocketIO] Disconnected { reason: 'transport close' }
[ConnectionStatus] Network online detected - forcing immediate reconnect
[SocketIO] Reconnect attempt 1
[SocketIO] Reconnect attempt 2
[SocketIO] Connected
[SocketIO Health] Pong received { latency: 48ms }
```

---

### Test 3: Network Offline (Airplane Mode)
**Duration**: 1:30 minutes  
**Prerequisites**: Connected to network

**Steps**:
1. Note current connection status (should be 🟢 Connected)
2. Enable Airplane Mode (or unplug network)
3. Watch status transition to yellow "Reconnecting..."
4. After ~15 seconds, "Force Reconnect" button should appear
5. Disable Airplane Mode
6. Verify automatic reconnection within 5 seconds
7. Status should return to 🟢 Connected

**Expected Results**:
- Immediate disconnect on Mode toggle
- Yellow status with "Reconnecting..." message
- Force Reconnect button appears at 15s mark
- Network recovery auto-triggers reconnection
- No forced logout (stays within 30s window)

**Pass Criteria**: Automatic reconnect on network recovery

**Console Expected Output**:
```
[SocketIO] Disconnected { reason: 'transport close' }
[ConnectionStatus] Network offline detected
[SocketIO] Reconnect attempt 1
... (attempts every 300-20000ms) ...
[ConnectionStatus] Network online detected - forcing immediate reconnect
[SocketIO] Connected
[SocketIO Health] Pong received { latency: 52ms }
[ConnectionStatus] Socket reconnected, logout cancelled
```

---

### Test 4: Zombie Connection Kill
**Duration**: 3 minutes  
**Prerequisites**: Connected normally

**Steps**:
1. Start monitoring console for health checks
2. Simulate network breakage:
   - Close laptop lid (sleep network)
   - Or: Disconnect WiFi, don't reconnect for 30s
3. Watch console for zombie detection (25+ seconds):
   ```
   [SocketIO Health] ZOMBIE DETECTED: No pong in 25s, killing connection
   ```
4. System should force disconnect + reconnect
5. After network recovery, verify pong resumes

**Expected Results**:
- Health checks continue for 25+ seconds with no pong
- Zombie detection triggers forced reconnect
- New connection established after zombie kill
- Pong responses resume

**Pass Criteria**: Zombie killed and recovered automatically

**Console Expected Output**:
```
[SocketIO Health] Sending ping...
[SocketIO Health] Sending ping...
... (no pong responses) ...
[SocketIO Health] ZOMBIE DETECTED: No pong in 25s, killing connection
[SocketIO] Force reconnecting: killing current connection
[SocketIO] Disconnected { reason: 'noop' }
[SocketIO] Reconnect attempt 1
[SocketIO] Connected
[SocketIO Health] Pong received { latency: 45ms }
```

---

### Test 5: Manual Force Reconnect Button
**Duration**: 1 minute  
**Prerequisites**: Connected

**Steps**:
1. Disconnect WiFi (but DON'T go over 30 seconds)
2. After 15 seconds, purple "Force Reconnect" button appears
3. Click the button
4. Watch console for immediate reconnection attempt
5. Verify status changes to 🟢 Connected quickly (< 5s if network available)

**Expected Results**:
- Button appears at 15s mark with sync icon
- Button is positioned left of status indicator
- Clicking triggers `forceReconnect()` immediately
- System attempts reconnection faster than auto-retry
- Console shows immediate reconnect attempts

**Pass Criteria**: Manual button triggers faster reconnection

**Console Expected Output**:
```
[ConnectionStatus] Manual reconnect triggered
[SocketIO] Force reconnecting: killing current connection
[SocketIO] Disconnected { reason: 'forced upgrade' }
[SocketIO] Reconnect attempt 1
[SocketIO] Connected
[SocketIO Health] Pong received { latency: 49ms }
```

---

### Test 6: 30-Second Logout Safety
**Duration**: 2 minutes  
**Prerequisites**: Connected

**Steps**:
1. Disconnect network
2. Status goes yellow "Reconnecting..."
3. Wait 30+ seconds WITHOUT reconnecting
4. Verify user is logged out and redirected to login page
5. Verify localStorage is cleared

**Expected Results**:
- Status stays yellow up to 30 seconds
- At 30 seconds: forced logout to login page
- Auth token cleared from localStorage
- User must login again
- No zombie sessions left

**Pass Criteria**: Logout occurs at exactly 30s timeout

**Console Expected Output**:
```
[ConnectionStatus] Socket disconnected, attempting aggressive reconnect...
... waiting 30s ...
[ConnectionStatus] Still disconnected after 30s. Forcing logout.
```

---

## Console Log Filtering

### View only Socket.IO logs:
```javascript
// In DevTools Console, filter by:
[SocketIO
```

### View only Health Check logs:
```javascript
// In DevTools Console, filter by:
[SocketIO Health
```

### View only ConnectionStatus logs:
```javascript
// In DevTools Console, filter by:
[ConnectionStatus
```

---

## Performance Metrics to Monitor

| Metric | Target | Test |
|--------|--------|------|
| Initial reconnect latency | < 300ms | Test 2, 3 |
| WiFi→LAN recovery | < 15s | Test 2 |
| Network offline recovery | < 5s on reconnect | Test 3 |
| Zombie kill threshold | 25s | Test 4 |
| Health check interval | 15s ± 1s | Test 1 |
| Pong latency | < 100ms | Test 1 |
| Logout safety timeout | 30s ± 1s | Test 6 |

---

## Troubleshooting

### Problem: Pong never received (timeout immediately)
**Diagnosis**: Backend not responding to pings
**Solution**: 
- Verify `server/app.py` has `@socketio_server.on('ping')` handler (lines 300-308)
- Check backend is running: `uvicorn app:asgi_app --reload`
- Check no 400/500 errors in backend logs

### Problem: Reconnection takes > 30 seconds
**Diagnosis**: Reconnection backoff too aggressive or network unreachable
**Solution**:
- Edit `socket.js` line 26: `reconnectionDelay: 300,` (try 200 for faster retry)
- Edit `socket.js` line 27: `reconnectionDelayMax: 20000,` (try 15000)
- Verify network is actually available
- Check backend CORS/auth not breaking Socket.IO reconnection

### Problem: Force Reconnect button never appears
**Diagnosis**: Component not re-rendering or timer not working
**Solution**:
- Check `ConnectionStatus.jsx` imports include `forceReconnect`
- Verify `disconnect` event is firing (check console)
- Try manual disconnect: `socket.disconnect()` in DevTools console

### Problem: Status shows "Reconnecting" but never recovers
**Diagnosis**: Backend unreachable or network broken
**Solution**:
- Verify backend is online: `curl http://127.0.0.1:5000/`
- Check network connectivity: `ping google.com`
- Monitor health check logs for zombie detection
- After 25s, zombie should be killed and force reconnect attempted

---

## Development Notes

### Configuration Points

**socket.js** (lines 14-29):
```javascript
const HEALTH_CHECK_INTERVAL = 15000; // Adjust ping frequency
const HEALTH_CHECK_TIMEOUT = 5000; // Pong wait time
const ZOMBIE_DETECTION_TIMEOUT = 25000; // Zombie kill threshold

export const socket = io(SOCKET_URL, {
  reconnectionDelay: 300, // Initial retry delay (ms)
  reconnectionDelayMax: 20000, // Max backoff (ms)
  pollInterval: isDev ? 300 : 1000, // Polling frequency
  timeout: 15000, // Connection timeout
});
```

**ConnectionStatus.jsx** (line 36):
```javascript
setTimeout(() => {
  /* logout after 30 seconds without reconnection */
}, 30000); // Adjust logout grace period
```

### Backend Health Check Handler

Location: `server/app.py` lines 300-308

```python
@socketio_server.on('ping')
async def handle_ping(sid, data):
    """Health check handler: client sends ping, we respond with pong."""
    try:
        timestamp = data.get('timestamp') if isinstance(data, dict) else None
        await socketio_server.emit('pong', {'timestamp': timestamp}, to=sid)
    except Exception as e:
        print(f"SocketIO health check error: {e}")
```

---

## Success Indicators

The reconnection system is operating correctly when:

1. Health checks show pong every 15s (Test 1)
2. WiFi↔LAN switches reconnect in < 15s (Test 2)
3. Network offline/online recovers automatically (Test 3)
4. Zombie connections are killed after 25s (Test 4)
5. Manual button works after 15s disconnect (Test 5)
6. Logout is enforced at 30s timeout (Test 6)

---

## Next Steps

After these tests pass:
1. Deploy socket.js changes to production
2. Update backend with ping handler in prod environment
3. Monitor production logs for any health check anomalies
4. Adjust reconnection delays based on real-world performance
5. Test with actual mobile app handoffs (WiFi→LTE→WiFi)
