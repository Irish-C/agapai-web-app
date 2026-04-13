# Migration Guide: MediaMTX → YOLO Streaming

This guide explains how to migrate from the old MediaMTX-based streaming to the new YOLO-enhanced RTSP streaming system.

## Overview of Changes

### Old System (MediaMTX)
- **URL**: `/mediamtx/{camera_id}` (RTSP relay)
- **Processing**: Off-device (external MediaMTX process)
- **AI**: Separate `/detect` endpoint (image-based)
- **Streaming**: RTSP over network
- **Complexity**: Multiple services (MediaMTX, SDK workers)

### New System (YOLO Streaming)
- **URL**: `/video_feed?camera_id=1` (HTTP MJPEG)
- **Processing**: In-process (FastAPI async)
- **AI**: Real-time inline YOLO inference
- **Streaming**: HTTP/MJPEG over network
- **Simplicity**: Single FastAPI service

## Migration Steps

### Step 1: Update Database Camera RTSP URLs

Ensure all cameras have `cam_rtsp` populated from their remote configurations:

```sql
-- Example: Set Dahua camera RTSP URL
UPDATE camera 
SET cam_rtsp = 'rtsp://admin:password@192.168.2.211:554/cam/realmonitor?channel=1&subtype=1'
WHERE id = 1;

-- Verify all cameras have RTSP URLs
SELECT id, cam_name, cam_rtsp FROM camera WHERE cam_rtsp IS NULL OR cam_rtsp = '';
```

### Step 2: Update Frontend Links

**Old links (if any):**
```jsx
// OLD - no longer works
<img src="/mediamtx/1" alt="stream" />
<a href="/snapshots/stream/1">View</a>
```

**New links:**
```jsx
// NEW - direct MJPEG stream
<img src="/video_feed?camera_id=1" alt="stream" />

// NEW - web UI viewer
<a href="/stream/1">View Stream</a>

// NEW - native component
<YOLOStreamViewer cameraId={1} />
```

### Step 3: Stop MediaMTX (Optional)

If you're only using streaming and not RTMP ingest:

```bash
# Stop MediaMTX service
sudo systemctl stop mediamtx

# Or if not systemd:
pkill -f mediamtx

# Disable on startup (optional)
sudo systemctl disable mediamtx
```

**Don't disable MediaMTX yet if you use it for:**
- Ingest from multiple sources
- RTMP streaming to external services
- Multi-format recording

### Step 4: Verify New Streaming Works

1. **Browser test:**
   ```
   http://localhost:8000/stream/1
   ```

2. **Direct stream test:**
   ```bash
   ffplay -rtsp_transport tcp "http://localhost:8000/video_feed?camera_id=1"
   ```

3. **Check logs:**
   ```
   [stream_generator] [OK] Connected to RTSP stream
   [stream_generator] [AI] YOLO model loaded successfully
   ```

### Step 5: Update Client Code

#### React Router Update

```jsx
// OLD routes (if they existed)
{/* <Route path="/camera/:id/stream" element={<OldMediaMTXViewer />} /> */}

// NEW routes
<Route path="/stream/:cameraId" element={<StreamViewerPage />} />
<Route path="/streams" element={<CameraStreamDashboard />} />
```

#### Component Update

Replace any `<img src="/mediamtx/...">` with:

```jsx
// Option 1: Direct MJPEG (simpler)
<img src={`/video_feed?camera_id=${cameraId}`} />

// Option 2: React component (better)
<YOLOStreamViewer cameraId={cameraId} />

// Option 3: Web UI (full featured)
<iframe src={`/stream/${cameraId}`} />
```

#### useCamera Hook Update

```javascript
// client/src/hooks/useCamera.js
export function useCamera() {
  // ... existing code ...
  
  // Add streaming URLs
  cameras.forEach(cam => {
    // OLD (deprecated)
    // cam. mediamtxUrl = `/mediamtx/${cam.id}`;
    
    // NEW (live streaming)
    cam.videoUrl = `/video_feed?camera_id=${cam.id}&use_ai=1&frame_skip=3`;
    cam.streamUrl = `/stream/${cam.id}`;
  });
  
  return { cameras };
}
```

### Step 6: Clean Up Old Assets (Optional)

If you have old MediaMTX config files:

```bash
# These are no longer needed, but safe to keep:
# - server/mediamtx
# - server/mediamtx.yml
# - docs/STREAMING_SETUP.md (archived)

# Keep but don't rely on:
# - server/src/controllers/camera_controller.py (publish_camera_to_mediamtx)
```

## Comparison: Old vs New

| Feature | MediaMTX | YOLO Streaming |
|---------|----------|---|
| **Latency** | ~500ms | 70-130ms (GPU) |
| **CPU Usage** | Medium | Low-Medium (frame_skip) |
| **GPU Support** | No | Yes (OpenVINO) |
| **Scalability** | 2-4 streams | 4-8 streams (same hardware) |
| **Setup Complexity** | High (external service) | Low (in-process) |
| **AI Inference** | Separate endpoint | Inline (real-time) |
| **RTMP Output** | Yes | No (use separate service) |
| **Multi-resolution** | Yes (subtype) | Single URL |
| **WebSocket** | Not native | Can add easily |

## Fallback: Keep Both Running

Run both systems in parallel during transition:

```python
# In FastAPI
# /video_feed -> YOLO streaming (NEW)
# /mediamtx/{id} -> MediaMTX relay (OLD, untouched)
```

No conflicts! Users can try new system while old still works.

**Transition timeline:**
1. **Week 1**: Deploy new YOLO streaming alongside MediaMTX
2. **Week 2**: Migrate frontend to use `/video_feed` links
3. **Week 3**: Test thoroughly with all cameras
4. **Week 4**: Disable MediaMTX if everything works

## Performance Expectations

### CPU Usage Typical Ranges

| Scenario | CPU % | GPU % | Notes |
|----------|-------|-------|-------|
| 1 stream, frame_skip=1, GPU | 15-25% | 20-40% | Highest accuracy |
| 1 stream, frame_skip=3, GPU | 8-15% | 10-20% | Balanced |
| 2 streams, frame_skip=3, GPU | 15-25% | 15-30% | Recommended |
| 4 streams, frame_skip=5, CPU | 40-60% | - | High CPU load |
| 4 streams, frame_skip=5, GPU | 25-35% | 50-70% | GPU-accelerated |

### Memory Usage

- Base FastAPI: ~150-200 MB
- Per stream: ~50-100 MB
- YOLO model: ~200-300 MB (once loaded)
- **Total for 2 streams**: ~500-700 MB

## Known Limitations & Workarounds

| Issue | Limitation | Workaround |
|-------|-----------|-----------|
| No RTMP output | YOLO streaming is HTTP only | Use separate MediaMTX for RTMP |
| Single resolution | `/video_feed` uses camera's RTSP URL as-is | App handles subtype in RTSP URL |
| No DVR recording | No built-in recording | Use ffmpeg with stream URL |
| Mobile MJPEG slow | MJPEG not ideal for mobile | Use lower frame_skip, quality |

## Rollback Plan

If new system fails:

1. **Revert endpoint:**
   ```python
   @router.get('/video_feed')
   async def video_feed_disabled():
       return JSONResponse(status_code=410, content={'status': 'disabled'})
   ```

2. **Restart MediaMTX:**
   ```bash
   sudo systemctl start mediamtx
   ```

3. **Update frontend back to `/mediamtx/{id}`**

4. **Verify old links work again**

## Testing Checklist

- [ ] All cameras have `cam_rtsp` in database
- [ ] Can connect to RTSP URL manually: `ffmpeg -i "rtsp://..."`
- [ ] `/video_feed?camera_id=1` works in browser
- [ ] `/stream/1` loads web UI
- [ ] AI inference running (boxes visible in stream)
- [ ] Adjusting sliders reconnects stream
- [ ] React components load stream without errors
- [ ] Mobile browser can view stream
- [ ] No memory leaks after 1hr streaming
- [ ] Graceful disconnect/reconnect works

## Support & Issues

### Stream not loading?
1. Check camera RTSP URL: `ffmpeg -rtsp_transport tcp -i "rtsp://..."`
2. Verify camera_id exists: `SELECT * FROM camera WHERE id = ?`
3. Check server logs for inference errors

### Poor performance?
1. Increase `frame_skip` (5-10)
2. Decrease `quality` (50-70)
3. Verify GPU is being used: `nvidia-smi`
4. Check network bandwidth with `iftop`

### AI not detecting?
1. Lower confidence threshold: `conf=0.3`
2. Check model loaded: server logs
3. Verify model: `python server/scripts/verify_model.py`
4. Try disabling other streams

## Next Steps

After migration completes:

1. **Remove MediaMTX publishing** from camera controller (if not used elsewhere)
2. **Add stream health checks** to monitoring
3. **Consider WebSocket** for real-time detection events
4. **Archive old streaming docs** in `/docs/deprecated/`
5. **Update team documentation** with new streaming system

## References

- [YOLO Streaming Guide](YOLO_STREAMING_GUIDE.md)
- [Quick Reference](YOLO_STREAMING_QUICK_REF.md)
- [Client Integration](YOLO_STREAMING_CLIENT_INTEGRATION.md)
