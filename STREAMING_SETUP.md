# Camera Streaming Setup Guide

## Architecture Overview

The AGAPAI system uses a two-stage streaming pipeline:

```
Camera RTSP Stream → FFmpeg Worker → MediaMTX Ingest → WebRTC WHEP → Browser
                                      (RTSP Ingest)
```

### Components

1. **Camera**: Original RTSP stream source (e.g., IP camera)
2. **FFmpeg Worker**: Captures camera stream and pushes to MediaMTX
   - If AI enabled: Runs object detection (ultralytics) and pushes processed frames
   - If AI disabled: Relays original stream with no processing
3. **MediaMTX**: Central streaming hub supporting multiple protocols
   - RTSP Ingest: Receives streams from workers (port 8554)
   - HTTP API: Management API (port 9997)
   - WebRTC/WHEP: Broadcasting to browsers (port 8889)
   - HLS: Alternative playback format (port 8888)
4. **Browser**: Displays stream via WebRTC protocol

## Configuration

### Server Environment Variables (.env)

```env
# RTSP ingest address (FFmpeg workers push here)
MEDIAMTX_URL=rtsp://127.0.0.1:8554

# MediaMTX HTTP API (for stream management)
MEDIAMTX_API=http://127.0.0.1:9997

# WebRTC/WHEP signaling (browser playback)
MEDIAMTX_WHEP=http://127.0.0.1:8889
```

### MediaMTX Configuration (mediamtx.yml)

- **rtspAddress**: RTSP protocol listener (8554) - workers push to this
- **hlsAlwaysRemux**: Ensures HLS format compatibility
- **webrtcAddress**: WebRTC/WHEP listener (8889) - browsers connect here
- **Dynamic paths**: `~original/.*` and `~processed/.*` accept any camera ID

## User Workflow

### Step 1: Add Camera in Settings

Settings → Device and Location → Add Camera

**Required fields:**
- Camera Name: Display name (e.g., "Main Hallway")
- RTSP Stream URL: Source stream (e.g., `rtsp://admin:pass@192.168.x.x:554/stream`)
- Location: Select or create location

**Result:** Camera saved to database but streaming NOT started yet

### Step 2: Publish Camera to Start Streaming

1. In Camera Management table, locate your camera
2. Click the **"Publish"** button (yellow button next to camera actions)
3. Status changes to **"Unpublish"** (gray button) = streaming is live

**What happens on Publish:**
- Backend starts FFmpeg worker process
- Worker connects to camera RTSP stream
- Worker pushes stream to MediaMTX
- MediaMTX makes it available via WebRTC/WHEP
- Browser can now display live video

### Step 3: View Live Stream

Navigate to Dashboard → Live View

- Only published cameras appear in grid
- Click camera to expand and watch full-screen
- AI detection overlay (if enabled)

### Step 4: Unpublish to Stop Streaming

Click **"Unpublish"** button next to camera

- FFmpeg worker is stopped
- MediaMTX removes stream
- No more video available
- Camera remains in database for future use

## Troubleshooting

### ❌ Camera shows "Offline" or "Stream Unavailable"

**Check 1: Is camera published?**
- Go to Settings → Device and Location
- Verify camera has **"Unpublish"** button (gray)
- If shows **"Publish"** (yellow), click it to start streaming

**Check 2: Is MediaMTX running?**
```bash
ps aux | grep mediamtx
```
Should show: `./mediamtx mediamtx.yml` process

If not running:
```bash
cd /home/agapai/agapai-web-app/server
./mediamtx mediamtx.yml &
```

**Check 3: Verify camera RTSP URL**
- Test camera URL locally:
```bash
ffmpeg -rtsp_transport tcp -i "rtsp://admin:pass@camera_ip:554/stream"
```
Should connect successfully

**Check 4: Check logs**
- Backend: `tail -f /path/to/backend/logs`
- MediaMTX: Check console output
- Frontend: Browser Developer Tools (F12) → Console

### ❌ Browser shows "Stream Unavailable"

**Check 1: Browser connectivity to port 8889**
```bash
curl http://127.0.0.1:8889
```

**Check 2: Camera actually published?**
- Verify "Unpublish" button shows (not "Publish")
- Try opening camera in a different browser

**Check 3: WebRTC connectivity**
- Check firewall allows port 8889
- Verify MEDIAMTX_WHEP env var is correct

### ❌ FFmpeg worker crashes immediately

**Check 1: Invalid camera RTSP URL**
- Verify URL format: `rtsp://user:pass@ip:port/path`
- Test camera accessibility

**Check 2: Invalid streaming path**
- Backend should automatically handle paths
- Check server logs for error messages

**Check 3: Port conflict**
- Verify MediaMTX not using ports 8554, 8888, 8889, 9997
- Check with: `ss -tlnp` or `netstat -tlnp`

## Performance Tuning

### For Low-Bandwidth Networks

Edit `mediamtx.yml`:
```yaml
hlsVariant: fmp4      # More compatible format
```

### For High-Performance

Enable hardware acceleration in `.env`:
```env
export OPENCV_FFMPEG_CAPTURE_OPTIONS="hwaccel;cuda"
export DEVICE="GPU"
```

### Disable AI Processing for Lower CPU Usage

Settings → Notifications → Global Settings → Toggle "AI Detection" OFF

- Only publishes original stream (no ultralytics inference)
- Significantly reduces CPU usage
- Streams served via `original/cam{id}` path

## Restart Services

### Full restart (safe)

```bash
# Stop all services
pkill mediamtx
pkill ffmpeg
pkill python3  # or more specific

# Wait 5 seconds
sleep 5

# Start MediaMTX
cd /home/agapai/agapai-web-app/server
./mediamtx mediamtx.yml &

# Frontend and backend auto-restart via npm/python
```

### Just MediaMTX restart

```bash
pkill mediamtx
cd /home/agapai/agapai-web-app/server
./mediamtx mediamtx.yml &
```

## Advanced: Manual Stream Test

### Test direct RTSP playback

```bash
# Connect to MediaMTX RTSP server
ffplay rtsp://127.0.0.1:8554/original/cam1
```

### Test WHEP WebRTC playback

```bash
# Requires special tools, but essentially testing if:
curl -X POST "http://127.0.0.1:8889/whep/play/cam1/"
```

### Check active streams in MediaMTX

```bash
curl "http://127.0.0.1:9997/v1/paths/list"
```

Should list published cameras and their stats.

## Reference

- **MediaMTX Docs**: https://github.com/bluenviron/mediamtx
- **WebRTC/WHEP**: https://github.com/ietf-wg-whep/draft-ietf-whep-protocol
- **FFmpeg RTSP**: https://ffmpeg.org/ffmpeg-protocols.html#rtsp
