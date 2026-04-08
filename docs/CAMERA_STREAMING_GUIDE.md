# Camera Streaming - Current Architecture

## 📋 How Streaming Works (Current)

```
1. User adds camera in Settings with valid RTSP URL
   ↓
2. MediaMTX automatically relays the RTSP stream
   ↓
3. MediaMTX exposes relay paths:
   - cam{id}: Direct source
   - original/cam{id}: Stable relay (default for UI)
   - processed/cam{id}: For future AI-processed streams
   ↓
4. Frontend requests HLS stream via /hls/original/cam{id}/index.m3u8
   ↓
5. MediaMTX serves HLS stream on port 8888
   ↓
6. Browser plays video via HLS.js
   ↓
7. AI toggle switches between original/cam{id} and processed/cam{id}
```

### Key Features
✅ **Automatic Relay** - No need to "publish" cameras, streams work immediately  
✅ **Reliable** - MediaMTX relay is more stable than FFmpeg workers  
✅ **HLS Playback** - Browser-compatible, no special codec needed  
✅ **Scalable** - Easy to add processing workers later for AI streams  

---

## 🔧 Previous Issues (Now Fixed)

### ✓ MediaMTX Configuration
- `mediamtx.yml` now includes proper relay paths for `original/*` and `processed/*`
- Both are configured to accept camera streams

### ✓ Environment Variables
- `MEDIAMTX_HLS=http://127.0.0.1:8888` - Primary playback endpoint
- `MEDIAMTX_API=http://127.0.0.1:9997` - Management API

---

## 🚀 Quick Start

### Option 1: Using startup script (Recommended)
```bash
cd /home/agapai/agapai-web-app
./start_services.sh
```

### Option 2: Manual startup
```bash
# Start MediaMTX in background
cd /home/agapai/agapai-web-app/server
./mediamtx mediamtx.yml &

# Backend and frontend auto-start with their normal commands
# (npm run dev for client, python app.py for server)
```

---

## 📺 User Instructions to Stream Camera

### Step 1: Create Camera
1. Open http://localhost:5173 and login
2. Go to **Settings → Device and Location**
3. Click **"Add Camera"**
4. Enter:
   - **Camera Name**: (e.g., "Main Hallway")
   - **RTSP URL**: `rtsp://username:password@camera_ip:port/stream`
     - Example: `rtsp://admin:12345@192.168.1.100:554/stream`
   - **Location**: Select location
5. Click **"Save"**

### Step 2: Publish Camera (Start Streaming)
1. In camera list, find your camera
2. Click **"Publish"** button (yellow/orange)
   - Button text changes to **"Unpublish"** (gray) = streaming active
3. Wait 2-3 seconds for worker to connect

### Step 3: View Stream
1. Go to **Dashboard → Live View**
2. Your published camera appears in grid
3. Click camera to expand to full-screen
4. If AI is enabled, detections overlay on video

### Step 4: Stop Streaming
1. Go back to **Settings → Device and Location**
2. Click camera's **"Unpublish"** button
   - Worker stops, camera goes offline
   - Database still has camera saved for future use

---

## 🎯 What Camera URL Format?

You need the **RTSP stream URL** from your camera. This varies by manufacturer:

### Common Formats

**Dahua Models:**
```
rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0
```

**Hikvision:**
```
rtsp://admin:password@192.168.1.100:554/Streaming/Channels/101
```

**Generic IP Camera:**
```
rtsp://admin:password@192.168.1.100:554/stream
```

**Find Your Camera's URL:**
1. Check camera manual or admin interface
2. Look for "RTSP URL" or "Stream URL"
3. Test with FFmpeg:
   ```bash
   ffmpeg -rtsp_transport tcp -i "rtsp://your:url:here"
   ```

---

## 📊 Monitoring

### Check MediaMTX Status
```bash
# Is it running?
ps aux | grep mediamtx

# Check ports are open
ss -tlnp | grep -E "(8554|8889|9997|8888)"

# View active streams
curl http://127.0.0.1:9997/v1/paths/list

# Check health
curl http://127.0.0.1:9997/ping
```

### Check FFmpeg Workers
```bash
# See active workers
ps aux | grep ffmpeg

# See published cameras in backend
cat /tmp/published_cameras.txt  # (if backend logs it)
```

### Browser Console
1. Open DevTools (F12) → **Console**
2. Look for error messages
3. Check **Network** tab for failed WebRTC requests

---

## 🐛 Troubleshooting

### "Offline" Camera but Published
- ✓ Verify RTSP URL is accessible
- ✓ Check camera login credentials
- ✓ Test: `ffmpeg -rtsp_transport tcp -i "rtsp://url"`
- ✓ Check backend logs for FFmpeg errors

### WebRTC Connection Fails
- ✓ Is MediaMTX running? `ps aux | grep mediamtx`
- ✓ Is port 8889 open? `ss -tlnp | grep 8889`
- ✓ Are other ports (8554, 9997) also open?
- ✓ Check firewall for port restrictions

### Still Shows "Stream Unavailable"
1. Check if Publish button shows (not in Unpublish state)
2. Try refreshing browser (Ctrl+Shift+R)
3. Check browser console for errors (F12)
4. Restart MediaMTX: `pkill mediamtx`
5. Check .env file has correct ports

---

## 📚 Documentation

Complete streaming guide: [STREAMING_SETUP.md](./STREAMING_SETUP.md)

---

## 🎬 Current Service Status

**MediaMTX:**
- ✓ RTSP Ingest: `rtsp://127.0.0.1:8554`
- ✓ HTTP API: `http://127.0.0.1:9997`
- ✓ WebRTC/WHEP: `http://127.0.0.1:8889`
- ✓ HLS: `http://127.0.0.1:8888`

**Backend:** Handles camera CRUD and worker lifecycle

**Frontend:** Displays streams via WebRTC protocol

---

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `server/mediamtx.yml` | Streaming server config |
| `server/.env` | Environment variables (ports, URLs) |
| `client/src/features/camera/CameraGrid.jsx` | Main UI for live view |
| `server/src/controllers/camera_controller.py` | Camera & streaming logic |
| `server/src/services/mediamtx_controller.py` | FFmpeg worker management |
| `STREAMING_SETUP.md` | Detailed technical guide |
| `start_services.sh` | Quick startup script |

