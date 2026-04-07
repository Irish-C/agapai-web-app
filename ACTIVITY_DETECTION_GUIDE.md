# Activity Detection System Guide

## Overview

The system has been updated to use **human activity recognition** instead of generic person detection. The YOLO model in `server/ml/best_openvino_model/` is trained to detect and classify **what people are doing**, not just identify if people are present.

## Detectable Activities

The model can recognize 8 different human activities:

| Activity | Color | Urgency | Description |
|----------|-------|---------|-------------|
| **🚨 Forward Fall** | RED | URGENT | Person falling forward |
| **🚨 Backward Fall** | RED | URGENT | Person falling backward |
| **🚨 Sideward Fall** | RED | URGENT | Person falling to the side |
| **⚠️ Lying Down** | BROWN | ATTENTION | Person lying on ground |
| **✅ Sitting** | DARK GREEN | NORMAL | Person sitting |
| **🍴 Eating** | DARK GREEN | NORMAL | Person eating |
| **✅ Standing** | GREEN | OK | Person standing |
| **🚶 Walking** | BLUE | MOVING | Person walking |

## Visual Color Scheme

When activity detection is enabled, boxes around detected activities are color-coded:

```
🔴 RED    = Falls (Forward, Backward, Sideward) - HIGHEST PRIORITY
🟤 BROWN  = Lying Down - Needs attention
🟢 GREEN  = Safe activities (Standing, Sitting, Eating)
🔵 BLUE   = Walking/Movement
⚪ WHITE  = Unknown activity
```

Each detection box displays:
- **Activity label** (e.g., "Standing", "Walking", "Forward Fall")
- **Confidence percentage** (0-100%, how confident the model is)

## How to Use

### 1. Enable Activity Detection

- Go to Global Settings in the web UI
- Toggle "Enable AI Analysis" **ON**
- The system will start streaming processed video with activity detection

### 2. Monitor the Live Stream

- Open the camera view
- When AI is enabled, you'll see:
  - **Colored boxes** around detected activities
  - **Labels** showing the activity type and confidence
  - **Color-coded urgency**: Red for falls, Brown for lying, Green for safe, Blue for movement

### 3. Check Server Logs

When activity detection is running, you'll see logs like:

```
[processing_worker] 🟢 ACTIVITY DETECTION ENABLED for camera 1 using CPU
[processing_worker] [DEBUG] Detectable activities: Backward Fall, Eating, Forward Fall, Lying Down, Sideward Fall, Sitting, Standing, Walking
[processing_worker] [DEBUG] ⚠️ Fall Detection: RED | Lying Down: BROWN | Sitting/Eating: GREEN | Standing: GREEN | Walking: BLUE
[processing_worker] [DEBUG] 🏃 Activity detection: 1 person activity(ies) detected
  🚨 Activity 0: Forward Fall (confidence=87%)
```

## Device Configuration

The system automatically uses the best available device:

- **GPU (HETERO:GPU,CPU)**: For hardware acceleration if available
- **CPU**: Automatic fallback if GPU not available
- **Configured via**: `DEVICE` and `OPENVINO_DEVICE` environment variables

Check logs to see which device is actually being used:
```
[processing_worker] [AI] Activity detection model loaded (actual=GPU)
```

## Frame Processing Flow

```
1. Video Frame Input
   ↓
2. Resize to 640x640 for model efficiency
   ↓
3. Run OpenVINO Activity Detection Inference
   ↓
4. Get predicted activities (with confidence scores)
   ↓
5. Draw color-coded boxes on original frame
   ↓
6. Stream to viewing device via MediaMTX (RTSP/HLS)
```

## Confidence Threshold

- **Model inference threshold**: 0.35 (only show activities with >35% confidence)
- **Detection threshold**: Applied per-frame to filter low-confidence detections

Lower threshold = more detections (including false positives)
Higher threshold = fewer detections (but more accurate)

## Debug Information

When monitoring, check logs for:

```
[processing_worker] [DEBUG] 🏃 Activity detection: N person activity(ies) detected
  Icon: Activity type (confidence%)
```

**Log Indicators:**
- 🟢 GREEN status = Inference working
- 🔴 RED status = Issue detected
- ⚠️ YELLOW warning = Configuration issue
- 📊 [DATA] = Statistics/counters
- 🐛 [DEBUG] = Detailed debugging info

## Performance Optimization

### Resolution & Speed Trade-off
- Model processes frames resized to **640x640**
- Original frame dimensions maintained for drawing
- Typical inference time: **50-150ms** per frame

### GPU Support
To enable GPU acceleration:
```bash
export OPENVINO_DEVICE=HETERO:GPU,CPU
npm run dev
```

Check which device is used:
```
Using OpenVINO LATENCY mode for batch=1 inference on (GPU)...
```

## Troubleshooting

### Problem: No activities detected
**Possible causes:**
1. No people visible in the video
2. People are partially obscured or too small
3. Confidence threshold too high
4. Model needs clear, well-lit video

**Solution:** Check server logs for "No activities detected" message

### Problem: Only seeing CPU, not GPU
**Logs show:**
```
Using OpenVINO LATENCY mode for batch=1 inference on (CPU)...
```

**Solution:**
- GPU support depends on system hardware
- CPU fallback is automatic
- Check if GPU drivers are installed
- System will use best available device

### Problem: High inference time (>200ms)
**Causes:**
- System resource contention
- High CPU/memory usage
- Model loading overhead (first frame)

**Solution:**
- Check system resources (`top`, `nvidia-smi`)
- Reduce other background processes
- Inference time stabilizes after first few frames

## Color Reference Quick Guide

When looking at the video stream:

| Color | Activity | Action |
|-------|----------|--------|
| 🔴 RED | Person Falling | ⚠️ Check immediately |
| 🟤 BROWN | Lying on Ground | ⚠️ Investigate |  
| 🟢 GREEN | Sitting/Standing/Eating | ✅ Normal |
| 🔵 BLUE | Walking | ✅ Moving |
| ⚪ WHITE | Unknown | ❓ Uncertain |

## Next Steps

1. **Test with real video**: Enable AI and point camera at people
2. **Monitor logs**: Check for detection patterns and confidence levels
3. **Adjust if needed**: Can modify confidence threshold or model weights if needed
4. **Set up alerts**: Configure notifications for high-priority activities (Falls, Lying)

## Technical Details

### Model Information
- **Type**: OpenVINO-optimized YOLO
- **Input**: 640x640 BGR images
- **Output**: Bounding boxes + activity class + confidence
- **Classes**: 8 human activity types
- **Device**: CPU or GPU (with OpenVINO)

### File Locations
- **Model files**: `server/ml/best_openvino_model/` (`best.xml`, `best.bin`, `metadata.yaml`)
- **Worker process**: `server/src/workers/processing_worker.py`
- **Detection endpoint**: `server/src/routes/video_routes.py`
- **Relay mode**: `server/src/workers/relay_worker.py` (when AI disabled)

### Environment Variables
```bash
OPENVINO_DEVICE=HETERO:GPU,CPU  # Use GPU with CPU fallback
DEVICE=GPU                       # Preferred device
```

## More Information

See [TOGGLE_ANALYSIS.md](TOGGLE_ANALYSIS.md) for details on how the AI toggle works in the system.
