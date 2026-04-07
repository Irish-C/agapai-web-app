# Activity Detection - Quick Reference Card

## Color Guide

```
🔴 RED    = Falling      → [Forward Fall, Backward Fall, Sideward Fall]
🟤 BROWN  = Lying Down   → [Lying Down]
🟢 GREEN  = Safe Act     → [Standing, Sitting, Eating]
🔵 BLUE   = Walking      → [Walking]
⚪ WHITE  = Unknown      → [Other/Unclassified]
```

## What Each Color Means

| Color | Activity | Urgency | Action |
|-------|----------|---------|--------|
| 🔴 RED | Falling | ⚠️ HIGH | Check immediately |
| 🟤 BROWN | Lying Down | ⚠️ MEDIUM | Investigate |
| 🟢 GREEN | Standing/Sitting/Eating | ✅ LOW | Normal |
| 🔵 BLUE | Walking | ✅ LOW | Normal |

## Log Messages to Expect

### ✅ Enabled (Normal)
```
[processing_worker] 🟢 ACTIVITY DETECTION ENABLED for camera 1 using CPU
[processing_worker] 🏃 Activity detection: 2 person activity(ies) detected
  🚨 Activity 0: Forward Fall (confidence=89%)
  ✅ Activity 1: Standing (confidence=92%)
```

### ❌ Disabled (Normal)
```
[processing_worker] 🔴 ACTIVITY DETECTION DISABLED for camera 1 (relay mode, pass-through)
```

### 📊 Every 100 Frames
```
[processing_worker] 📊 Camera 1 Frame 1000: 5 activity(ies) detected
[processing_worker] 📊 Camera 1 Frame 2000: No activities detected
```

## Detectable Activities List

| # | Activity | Expected Color | Icon |
|---|----------|---|---|
| 1 | Forward Fall | 🔴 RED | 🚨 |
| 2 | Backward Fall | 🔴 RED | 🚨 |
| 3 | Sideward Fall | 🔴 RED | 🚨 |
| 4 | Lying Down | 🟤 BROWN | ⚠️ |
| 5 | Sitting | 🟢 GREEN | ✅ |
| 6 | Standing | 🟢 GREEN | ✅ |
| 7 | Walking | 🔵 BLUE | 🚶 |
| 8 | Eating | 🟢 GREEN | 🍴 |

## Troubleshooting Quick Check

### "I don't see any boxes in the video"
```
Check 1: Is AI enabled?
  [web UI] → Global Settings → Is "Enable AI Analysis" toggled ON?
  
Check 2: Are there people in the video?
  [video] → Do you see people in the camera feed?
  
Check 3: Are model files present?
  [terminal] $ ls -la server/ml/best_openvino_model/
  (Should show: best.xml, best.bin, metadata.yaml)
  
Check 4: Check server logs
  [terminal] $ tail -f server.log | grep "ACTIVITY DETECTION"
  Should see: "🟢 ACTIVITY DETECTION ENABLED"
```

### "I see boxes but no labels"
```
Check 1: Box colors visible?
  ✓ RED boxes present? → Falls detected ✓
  ✓ GREEN boxes present? → Standing/Sitting detected ✓
  ✓ BLUE boxes present? → Walking detected ✓
  
Check 2: Are labels cut off?
  [video] → Try expanding the video window (labels at top of box)
  
Check 3: Camera resolution ok?
  [logs] → Check inference time < 200ms
```

### "All boxes are one color (not color-coded)"
```
This shouldn't happen with updated code.

If seeing all GREEN:
  $ grep "get_activity_color" server/src/workers/processing_worker.py
  (Should show activity-specific color mapping)
  
Try: Restart server
  $ npm run dev
```

### "Inference is slow (>200ms per frame)"
```
Check 1: GPU or CPU?
  [logs] → Look for "Using OpenVINO LATENCY mode on (GPU)" or "(CPU)"
  [logs] → GPU should be 30-50ms, CPU should be 80-150ms
  
Check 2: System load
  [terminal] $ top
  (Check if other processes using CPU/memory)
  
Check 3: First frame slower?
  (Normal - model loading overhead on first frame)
```

## Quick Commands

### Watch Activity Detection Logs
```bash
# Real-time activity detection output
tail -f server.log | grep "ACTIVITY DETECTION\|Activity detection"

# All debug messages
tail -f server.log | grep "\[DEBUG\]"

# Activity types being detected
tail -f server.log | grep "Activity \d:"
```

### Check Model Exists
```bash
ls -la server/ml/best_openvino_model/
# Should show: best.xml, best.bin, metadata.yaml
```

### Start Server with Debug Output
```bash
DEVICE=GPU OPENVINO_DEVICE=HETERO:GPU,CPU npm run dev
# Then check logs for "actual=GPU" or "actual=CPU"
```

## Device Info

### Configured vs Actual
```
Configured: Set by OPENVINO_DEVICE env var (default: HETERO:GPU,CPU)
Actual: What's really being used (GPU or CPU)

✓ GPU: 30-50ms per frame (fast)
✓ CPU: 80-150ms per frame (slower but works everywhere)
⚠️ UNKNOWN: Device detection failed
```

## Sample Log Output

### Everything Working ✅
```
[processing_worker] 🟢 ACTIVITY DETECTION ENABLED for camera 1 using CPU
[processing_worker] 📋 Detectable activities: Backward Fall, Eating, Forward Fall, Lying Down, Sideward Fall, Sitting, Standing, Walking
[processing_worker] ⚠️ Fall Detection: RED | Lying Down: BROWN | Sitting/Eating: GREEN | Standing: GREEN | Walking: BLUE
[processing_worker] 📊 Camera 1 Frame 100: 1 activity(ies) detected
[processing_worker] 🏃 Activity detection: 1 person activity(ies) detected
  ✅ Activity 0: Standing (confidence=92%)
```

### Problem Detected ❌
```
[processing_worker] 🔴 ACTIVITY DETECTION DISABLED for camera 1
# AI toggle is OFF in settings - turn it ON
```

## Box Label Format

Each detected activity shows:
```
[Activity Name] [Confidence %]

Examples:
- "Forward Fall 89%" → Person falling
- "Standing 92%" → Person standing
- "Walking 78%" → Person walking
- "Sitting 85%" → Person sitting
```

## Key Indicators

| Symbol | Meaning |
|--------|---------|
| 🟢 | Green/Working/Enabled |
| 🔴 | Red/Problem/Disabled |
| 🟠 | Orange/Warning/Fallback |
| 🏃 | Activity detected |
| 🚨 | Fall detected (urgent) |
| ✅ | Safe activity |
| 🚶 | Walking/Movement |
| 📊 | Statistics/Data |
| 📋 | Information/Config |
| ⚠️ | Warning |

## Common Issues

| Issue | Check | Fix |
|-------|-------|-----|
| No boxes | GPU/CPU | Check "actual=" in logs |
| Wrong colors | Model | Restart: `npm run dev` |
| Slow inference | System | Check `top` output, stop other processes |
| No detections | Video quality | Check lighting, resolution |
| GPU not used | Driver | Check `nvidia-smi` or GPU driver |
| Model not found | Path | Check `ls server/ml/best_openvino_model/` |

## References

- **Full Documentation**: See ACTIVITY_DETECTION_GUIDE.md
- **Debug Logs**: See AI_DEBUG_FEATURES.md
- **Implementation Details**: See ACTIVITY_DETECTION_IMPLEMENTATION.md
