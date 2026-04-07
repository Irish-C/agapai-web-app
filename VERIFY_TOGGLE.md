# How to Verify the AI Detection Toggle is Working

## Quick Verification (5 minutes)

### Step 1: Open Browser DevTools
1. Open the app in your browser
2. Press `F12` to open DevTools
3. Go to the **Network** tab
4. Go to **Console** tab (keep it visible for logs)

### Step 2: Navigate to Settings
1. Click Settings (gear icon)
2. Go to **CameraNotificationSettings** component
3. Find the toggle labeled **"Enable AI Detection (YOLO)"**

### Step 3: Test Disable
1. **Toggle OFF** (click to disable AI detection)
2. Check Network tab:
   - Should see `POST /settings/notifications/global`
   - Check the request body (click on the request, go to "Request" tab)
   - Should show `{"ai_enabled": false}`
3. Toggle description should change to: **"Raw streaming data is used"**
4. Wait 2 seconds

### Step 4: Observe Server Impact
1. Open a second terminal and run:
   ```bash
   tail -f $VSCODE_TARGET_SESSION_LOG/debug*.log | grep -E "(detect|YOLO|inference)"
   ```
   Or check server logs at: `/home/agapai/agapai-web-app/server/logs/`

2. You should NOT see:
   ```
   [detect] Inference time:
   [camera_controller] Frame X: YOLO ran
   ```

### Step 5: Test Enable
1. **Toggle ON** (click to enable AI detection)
2. Check Network tab:
   - Should see `POST /settings/notifications/global`
   - Body should show `{"ai_enabled": true}`
3. Toggle description should change to: **"Inference is enabled using YOLO model"**
4. Check server logs - should now see:
   ```
   [detect] Inference time: XX.Xms
   ```

---

## Detailed Test with cURL

### 1. Check Current State
```bash
# Get current settings (need auth token)
curl -X GET http://localhost:5000/settings/notifications/global \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Response should include:
# {
#   "ai_enabled": true/false,
#   "emit_fall": true/false,
#   ...
# }
```

### 2. Disable AI
```bash
curl -X POST http://localhost:5000/settings/notifications/global \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ai_enabled": false}'

# Response:
# {"status": "success", "settings": {...}}
```

### 3. Test /detect Endpoint (AI Disabled)
```bash
# Create a test image
python3 << 'EOF'
import cv2
import numpy as np
img = np.zeros((100, 100, 3), dtype=np.uint8)
img[30:70, 30:70] = [0, 255, 0]  # Green square
cv2.imwrite("/tmp/test.jpg", img)
EOF

# Send to /detect
curl -X POST http://localhost:5000/detect \
  -H "Content-Type: image/jpeg" \
  --data-binary @/tmp/test.jpg | json_pp

# When ai_enabled=false, should return:
# {
#   "detections": [],
#   "ai_enabled": false
# }
```

### 4. Enable AI
```bash
curl -X POST http://localhost:5000/settings/notifications/global \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ai_enabled": true}'
```

### 5. Test /detect Endpoint (AI Enabled)
```bash
curl -X POST http://localhost:5000/detect \
  -H "Content-Type: image/jpeg" \
  --data-binary @/tmp/test.jpg | json_pp

# When ai_enabled=true, should return:
# {
#   "detections": [...],  # May be empty for plain image, but inference ran
#   "ai_enabled": true,
#   "inference_ms": XX.X
# }
```

---

## Visual Indicators the Toggle is Working

### ✅ Toggle is OFF (AI Disabled)
- Settings UI shows toggle in gray (unchecked)
- Description: **"Raw streaming data is used"**
- Camera streams use `original/cam{id}` prefix (faster, less CPU)
- Server logs: NO inference messages
- `/detect` endpoint returns immediately with `detections: [], ai_enabled: false`
- Server CPU usage drops noticeably

### ✅ Toggle is ON (AI Enabled)
- Settings UI shows toggle in teal/green (checked)
- Description: **"Inference is enabled using YOLO model"**
- Camera streams use `processed/cam{id}` prefix (has AI boxes overlaid)
- Server logs show:
  ```
  [detect] Inference time: 45.2ms
  [camera_controller] Frame 600: YOLO ran, detected 1 object(s)
  ```
- `/detect` endpoint takes 40-100ms (inference time)
- Server CPU usage increases (GPU/CPU running inference)

---

## Troubleshooting

### Issue: Toggle changes but nothing happens
**Solution:**
1. Check browser console for errors (F12)
2. Verify you're logged in as admin (required for settings)
3. Check network response shows `"status": "success"`
4. Refresh page and check if toggle state persists

### Issue: Can't see Network requests
**Solution:**
1. Make sure DevTools is open BEFORE toggling
2. Filter Network tab by "settings" or "global"
3. Check "Preserve log" checkbox in Network tab

### Issue: /detect endpoint always returns empty detections
**Check:**
1. Is YOLO model actually loaded? (Check server startup logs for "✓ Loaded")
2. Try a real camera frame instead of test image
3. Check `/detect` response includes `"ai_enabled": true`

### Issue: Server logs show errors
**Traces to check:**
```bash
# Check for YOLO model errors
grep -i "yolo\|model" server/logs/*.log

# Check for inference errors
grep -i "inference\|predict" server/logs/*.log

# Check for database errors
grep -i "database\|globalsetting" server/logs/*.log
```

---

## Expected Behavior Summary

| Action | UI Change | Network | Server | Stream | CPU |
|--------|-----------|---------|--------|--------|-----|
| **Toggle OFF** | Gray, "Raw streaming" | POST global, ai_enabled=false | No YOLO logs | original/cam{id} | ↓ Low |
| **Toggle ON** | Teal, "Inference enabled" | POST global, ai_enabled=true | YOLO logs appear | processed/cam{id} | ↑ High |
| **/detect OFF** | - | Returns empty | Returns empty immediately | - | ↓ |
| **/detect ON** | - | Returns detections | 40-100ms inference | - | ↑ |

---

## Notes
- **First request after toggle:** May take 1-2 seconds to propagate
- **Browser caching:** Disable if needed (DevTools → Settings → disable cache)
- **Multiple tabs:** Toggle in one tab affects all tabs (uses shared database)
- **Server restart**: Settings persist through server restart
