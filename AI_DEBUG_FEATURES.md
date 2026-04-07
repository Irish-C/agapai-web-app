# Activity Detection Debug Features - Complete Guide

## Overview

Debug features have been added throughout the codebase to track when activity detection is being used in video processing. These features include colored emoji indicators and detailed logging to help monitor activity detection toggle state, model loading, inference activity, and stream selection.

⚠️ **Important:** This system detects **human activities** (Standing, Walking, Falling, etc.), not just people. See [ACTIVITY_DETECTION_GUIDE.md](ACTIVITY_DETECTION_GUIDE.md) for details.

---

## Server-Side Debug Output

### 1. **Model Loading** (`server/src/routes/video_routes.py`)

**Location:** `_load_yolo_model()` function

When the activity detection model is loaded, you'll see:
```
[video_routes] 🟢 ACTIVITY DETECTION MODEL LOADED - OpenVINO model ready (configured=HETERO:GPU,CPU, actual=GPU)
```

Showing both the configured device (from env var) and actual device being used.

When failed:
```
[video_routes] ❌ Model path not found: /path/to/model
[video_routes] ❌ Failed to load activity detection model: <error message>
```

### 2. **Detect Endpoint** (`server/src/routes/video_routes.py`)

**When ACTIVITY DETECTION is DISABLED** (early return):
```
[detect] 🔴 ACTIVITY DETECTION DISABLED - Skipping inference
```

**When ACTIVITY DETECTION is ENABLED** (before inference):
```
[detect] 🟢 ACTIVITY DETECTION ENABLED - Running inference (device=HETERO:GPU,CPU, conf_threshold=0.3)
[detect] [OK] Inference completed in 45.2ms
```

**Activity Detection Results**:
```
[detect] 📊 Found 2 activity(ies): ['Forward Fall', 'Standing']
[detect] 📊 No activities detected in this frame
```

### 3. **Camera Controller** (`server/src/controllers/camera_controller.py`)

**When publishing camera stream with AI enabled**:
```
[camera_controller] 🟢 AI ENABLED for camera 1 - spawning processing worker with YOLO inference
```

**When publishing camera stream with AI disabled**:
```
[camera_controller] 🔴 AI DISABLED for camera 1 - using relay mode without processing
```

### 4. **Processing Worker** (`server/src/workers/processing_worker.py`)

**Model Loading**:
```
[processing_worker] [AI] Activity detection model loaded (OpenVINO=True, configured=HETERO:GPU,CPU, actual=CPU) for camera 1
[processing_worker] 🟢 ACTIVITY DETECTION ENABLED for camera 1 using CPU
[processing_worker] 📋 Detectable activities: Backward Fall, Eating, Forward Fall, Lying Down, Sideward Fall, Sitting, Standing, Walking
[processing_worker] ⚠️ Fall Detection: RED | Lying Down: BROWN | Sitting/Eating: GREEN | Standing: GREEN | Walking: BLUE
```

**Activity Detections** (per-frame):
```
[processing_worker] 🏃 Activity detection: 1 person activity(ies) detected
  🚨 Activity 0: Forward Fall (confidence=87%)

[processing_worker] 🏃 Activity detection: 2 person activity(ies) detected
  ✅ Activity 0: Standing (confidence=92%)
  🚶 Activity 1: Walking (confidence=78%)
```

**Relay Mode (No Activity Detection)**:
```
[processing_worker] 🔴 ACTIVITY DETECTION DISABLED for camera 1 (relay mode, pass-through)
```

**Periodic Activity Reporting** (every 100 frames):
```
[processing_worker] 📊 Camera 1 Frame 1000: 2 activity(ies) detected
[processing_worker] 📊 Camera 2 Frame 1000: No activities detected
[processing_worker] [OFF] Camera 3 Frame 1000: Relay mode (pass-through, no AI)
```

---

## Client-Side Debug Output

### 1. **AI Setting Fetch** (`client/src/features/camera/CameraGrid.jsx`)

**When AI settings are fetched**:

```javascript
[CameraGrid] [SETTING] AI is 🟢 ENABLED
[CameraGrid] [SETTING] AI is 🔴 DISABLED
```

**If fetch fails**:
```javascript
[CameraGrid] Failed to fetch AI settings: <error message>
```

### 2. **Stream Prefix Selection**

When selecting which stream to use based on AI state:

**For focused (large) camera**:
```javascript
[CameraGrid] [STREAM] Focused camera 1: using 'processed' stream (AI is 🟢 enabled)
[CameraGrid] [STREAM] Focused camera 2: using 'original' stream (AI is 🔴 disabled)
```

**For grid cameras** (every time cameras are rendered):
```javascript
[CameraGrid] [STREAM] Grid camera 1: using 'processed' stream (AI is 🟢 enabled)
[CameraGrid] [STREAM] Grid camera 2: using 'original' stream (AI is 🔴 disabled)
```

---

## How to Monitor AI Usage

### **Option 1: Server Logs (Terminal)**

Watch server terminal for these keyword patterns:

```bash
# Watch for AI status changes
grep -E "(AI ENABLED|AI DISABLED)" <server-logs>

# Watch for inference timing
grep -E "Inference completed|Inference time" <server-logs>

# Watch for detections
grep -E "Found.*object|No objects|detected" <server-logs>
```

### **Option 2: Browser Console**

1. Open browser DevTools (`F12`)
2. Go to **Console** tab
3. Filter for `[CameraGrid]` logs
4. Look for stream selection and AI setting fetch logs

### **Option 3: Real-Time Monitoring**

```bash
# Terminal 1: Watch server logs
tail -f <server-logs> | grep -E "\[detect\]|\[processing_worker\]|\[camera_controller\]"

# Terminal 2: Watch for AI toggle changes
tail -f <server-logs> | grep -E "🔴|🟢|🟡"
```

---

## Debug Emoji Reference

| Label | Meaning | Context |
|-------|---------|----------|
| [AI] | Model loaded | YOLO model initialization |
| 🟢 | AI ENABLED | Inference is running |
| 🔴 | AI DISABLED | Inference is skipped |
| [OK] | Success | Operation completed successfully |
| [ERROR] | Error/Failed | Operation failed | 
| [DATA] | Detection Info | Object detection count |
| [STREAM] | Video/Stream | Stream selection |
| [SETTING] | AI Setting | AI toggle state change |
| ⚠️ | Warning | Unexpected state |

---

## Device Information (CPU/GPU)

### **Configured Device**
The device specified via environment variables in this order:
1. `OPENVINO_DEVICE` environment variable
2. `DEVICE` environment variable  
3. Default: `HETERO:GPU,CPU` (try GPU first, fallback to CPU)

### **Actual Device**
The device that's actually being used at runtime:
- `GPU` - GPU acceleration is active
- `CPU` - Running on CPU (either by config or because GPU unavailable)
- `UNKNOWN` - Device detection failed

### **Example Output**
```
[video_routes] [AI] AI MODEL LOADED - configured=HETERO:GPU,CPU, actual=GPU
[processing_worker] 🟢 AI ENABLED for camera 1 using GPU
```

If GPU is unavailable, you'll see:
```
[processing_worker] 🟢 AI ENABLED for camera 1 using CPU
```

---

## Debugging Workflow

### **Problem: AI should be enabled but isn't running**

1. Check browser console for:
   ```
   [CameraGrid] [SETTING] AI is 🟢 ENABLED
   ```

2. Check server logs for:
   ```
   [detect] 🟢 AI ENABLED - Running YOLO inference
   [camera_controller] 🟢 AI ENABLED for camera X
   ```

3. If both show enabled but no inference results, check:
   ```
   [detect] [DATA] No objects detected in this frame
   ```
   (This is normal - means inference ran but found nothing)

### **Problem: AI is disabled but still processing**

1. Browser should show:
   ```
   [CameraGrid] [SETTING] AI is 🔴 DISABLED
   ```

2. Server should show:
   ```
   [detect] 🔴 AI DISABLED - Skipping inference
   [processing_worker] 🔴 AI DISABLED - relay mode
   ```

3. If still seeing inference logs, server may need restart to pick up the toggle change

### **Problem: Stream not switching between processed/original**

1. Check browser console for:
   ```
   [CameraGrid] [STREAM] Grid camera X: using '...' stream
   ```

2. Check Network tab to see actual HLS endpoint being requested:
   - Should be `/hls/processed/camX/` when AI enabled
   - Should be `/hls/original/camX/` when AI disabled

### **Problem: AI is enabled but NO DRAWING on video!**

**Root Cause:** The processing worker wasn't receiving the `--model` parameter, so YOLO never loaded.

**Fix Applied:** Added `--model` parameter to processing_worker command in `camera_controller.py`

**Verification in Server Logs:**
```
[camera_controller] 🟢 AI ENABLED for camera 1 - spawning processing worker with YOLO inference (model: /path/to/ml/best_openvino_model, exists: True)
[processing_worker] [AI] YOLO model loaded (OpenVINO=True, configured=HETERO:GPU,CPU, actual=GPU) for camera 1
[processing_worker] 🟢 AI ENABLED for camera 1 using GPU
[processing_worker] [DATA] Camera 1 Frame 100: 2 object(s) detected
```

**If `exists: False`:**
- Check that model exists at: `server/ml/best_openvino_model/`
- Verify it contains `.xml` and `.bin` files (export/convert the model if missing)

---

## Testing the Debug Output

### **Quick Test Script**

```bash
#!/bin/bash
# Save as /tmp/test_ai_debug.sh

echo "Testing AI Debug Features..."
echo ""

# Start watching server logs
echo "Starting server log tail (watching for debug output)..."
tail -f /path/to/server/logs | grep -E "\[detect\]|\[camera_controller\]|\[processing_worker\]" &
TAIL_PID=$!

# Give it a moment to start
sleep 1

# Let it run for 10 seconds
echo "Monitoring for 10 seconds..."
sleep 10

# Kill the tail
kill $TAIL_PID 2>/dev/null

echo ""
echo "Check above for debug output patterns:"
echo "  ✓ 🟢 AI ENABLED messages"
echo "  ✓ [DATA] Detection count messages"
echo "  ✓ [OK] Inference timing messages"
```

### **Manual Test**

1. **Toggle AI OFF** in Settings
   - Browser console should show: `🔴 DISABLED`
   - Server should show: `🔴 AI DISABLED - Skipping inference`
   - CPU usage should drop

2. **Toggle AI ON** in Settings
   - Browser console should show: `🟢 ENABLED`
   - Server should show: `🟢 AI ENABLED - Running YOLO inference`
   - CPU usage should increase

---

## Notes

- **First Request Latency**: First inference request after model load (~2s) may be slow
- **Frame Caching**: Processing worker logs detection counts every 100 frames to avoid log spam
- **Development**: All debug output is prefixed with `[component_name]` for easy filtering
- **Production**: Consider reducing log output verbosity in production by filtering log levels

---

## Files Modified

1. `server/src/routes/video_routes.py` - Added AI detection endpoint debug logging
2. `server/src/controllers/camera_controller.py` - Added camera publish debug logging
3. `server/src/workers/processing_worker.py` - Added frame processing debug logging
4. `client/src/features/camera/CameraGrid.jsx` - Added AI state and stream selection debug logging
