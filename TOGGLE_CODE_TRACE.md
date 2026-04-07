# AI Detection Toggle - Complete Code Flow with Line References

## 1️⃣ USER TOGGLES UI (Frontend)

**File:** `client/src/features/camera/CameraNotificationSettings.jsx`

```
Lines 243-247:
├─ Toggle component receives: checked={globalSettings.ai_enabled}
├─ On change: onToggle={(v) => saveGlobalSettings({ ai_enabled: v })}
└─ This triggers the saveGlobalSettings function
```

**Function:** `saveGlobalSettings` (Lines 165-182)
```
165  const saveGlobalSettings = async (partial) => {
166    const prevSettings = globalSettings;
167    const updatedSettings = { ...globalSettings, ...partial };
168    setGlobalSettings(updatedSettings);  // Optimistic update
169    try {
170      await fetchApi('/settings/notifications/global', 'POST', updatedSettings);
171      setError(null);
172    } catch (err) {
173      // Rollback on error
174      setGlobalSettings(prevSettings);
175    }
  };
```

**Result:** Sends `POST /settings/notifications/global` with body `{ ai_enabled: true|false }`

---

## 2️⃣ BACKEND RECEIVES TOGGLE (API Route)

**File:** `server/src/routes/settings_routes.py`

```
Lines 14-17:
├─ Route: POST /settings/notifications/global
├─ Auth: Requires admin (require_admin_user_id)
├─ Handler: post_global_notification_settings()
├─ Reads request body via get_sanitized_json()
└─ Calls: save_global_notifications_logic(data)
```

**Code:**
```python
@router.post('/settings/notifications/global')
async def post_global_notification_settings(request: Request, user_id: str = Depends(require_admin_user_id)):
    data = await get_sanitized_json(request)  # Gets { ai_enabled: true|false }
    result, code = await save_global_notifications_logic(data)
    return safe_json_response(status_code=code, content=result)
```

---

## 3️⃣ BACKEND SAVES TO DATABASE (Settings Logic)

**File:** `server/src/controllers/settings_controller.py`

**Function:** `save_global_notifications_logic` (Lines 60-78)

```
60  async def save_global_notifications_logic(data):
61    try:
62      payload = {}
63      # ... other settings handled here ...
71      if 'ai_enabled' in data:
72        payload['ai_enabled'] = bool(data.get('ai_enabled'))  # Convert to bool
73
74      gs = await db.globalsetting.find_first()
75      if gs:
76        updated = await db.globalsetting.update(where={'id': gs.id}, data=payload)
77        return {"status": "success", "settings": updated}, 200
78      else:
79        created = await db.globalsetting.create(data=payload)
80        return {"status": "success", "settings": created}, 201
```

**Database:** `server/prisma/schema.prisma` (Line 90)
```prisma
model GlobalSetting {
  id                  Int     @id @default(autoincrement())
  ai_enabled          Boolean @default(true)  // ← STORED HERE
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## 4️⃣ FRONTEND FETCHES TOGGLE STATE (Settings Read)

**File:** `client/src/features/camera/CameraGrid.jsx`

**useEffect:** (Lines 73-88)
```
73  // Fetch global AI setting (ai_enabled)
74  useEffect(() => {
75    let mounted = true;
76    const getSettings = async () => {
77      try {
78        const data = await fetchApi('/settings/notifications/global', 'GET');
79        if (!mounted) return;
80        setAiEnabled(Boolean(data.ai_enabled));  // ← SETS aiEnabled state
81      } catch (e) {
82        // keep default
83      }
84    };
85    getSettings();
86    return () => { mounted = false; };
87  }, []);
```

**Used in:** (Lines 223, 247)
```
223  const prefix = aiEnabled ? 'processed' : 'original';  // Line 223
247  const prefix = aiEnabled ? 'processed' : 'original';  // Line 247
```

---

## 5️⃣ BACKEND READS TOGGLE FOR INFERENCE (Key Control Point)

**File:** `server/src/routes/video_routes.py`

**Endpoint:** `@router.post('/detect')` (Lines 143-155)

```
143  # Early check: if global AI is disabled, skip inference
144  try:
145    gs = await db.globalsetting.find_first()
146    ai_enabled = True if not gs else bool(getattr(gs, 'ai_enabled', True))
147  except Exception:
148    ai_enabled = True
149
150  if not ai_enabled:  # ← IF DISABLED, RETURN EMPTY
151    req_ts = request.headers.get('X-Request-Ts')
152    return JSONResponse(content={
153      'request_timestamp': int(req_ts) if req_ts and str(req_ts).isdigit() else int(time.time() * 1000),
154      'response_timestamp': int(time.time() * 1000),
155      'detections': [],  # ← EMPTY!
156      'ai_enabled': False
157    })
```

**If enabled**, continues to inference section:

```
227  results = await asyncio.to_thread(lambda: YOLO_MODEL.predict(source=img, conf=0.3, imgsz=640, verbose=False))
```

---

## 6️⃣ RESPONSE VARIES BASED ON TOGGLE

### When `ai_enabled = FALSE`

**Response Format:**
```json
{
  "request_timestamp": 1712345678000,
  "response_timestamp": 1712345678001,
  "detections": [],
  "ai_enabled": false
}
```

**Characteristics:**
- ✓ Returns immediately (< 5ms)
- ✓ No YOLO inference runs
- ✓ Empty detections list
- ✓ Signals to client that AI is disabled

### When `ai_enabled = TRUE`

**Response Format:**
```json
{
  "request_timestamp": 1712345678000,
  "response_timestamp": 1712345678001,
  "detections": [
    {
      "label": "person",
      "confidence": 0.95,
      "box": [0.2, 0.3, 0.4, 0.5]
    }
  ],
  "ai_enabled": true,
  "inference_ms": 47.3
}
```

**Characteristics:**
- ✓ Takes 40-100ms (inference time)
- ✓ YOLO model runs on image
- ✓ Returns detected objects
- ✓ Includes inference_ms timing

---

## 7️⃣ STREAM SWITCHING IN FRONTEND

**File:** `client/src/features/camera/CameraGrid.jsx`

**Stream Selection Logic:**
```
223  const prefix = aiEnabled ? 'processed' : 'original';
     
     // Build stream URL using prefix
     const streamUrl = `${BASE_URL}/stream/.../${prefix}/cam${camId}`;
```

**Result:**
- **If `aiEnabled = true`:**
  - Uses: `BASE_URL/stream/processed/cam{id}`
  - Stream may include YOLO bounding boxes (if processing_worker.py is running with YOLO enabled)
  - Higher CPU usage

- **If `aiEnabled = false`:**
  - Uses: `BASE_URL/stream/original/cam{id}`  
  - Raw RTSP stream relayed directly
  - Lower CPU usage

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ USER INTERFACE (React)                                  │
│ CameraNotificationSettings.jsx                          │
│                                                         │
│ Toggle: "Enable AI Detection (YOLO)"                   │
│ ✓ Sends: POST /settings/notifications/global           │
│   Body: { ai_enabled: true|false }                     │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ BACKEND ROUTE (settings_routes.py)                      │
│ POST /settings/notifications/global                    │
│ Line 14-17                                              │
│ ✓ Validates admin auth                                 │
│ ✓ Calls: save_global_notifications_logic(data)         │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ SETTINGS CONTROLLER (settings_controller.py)            │
│ save_global_notifications_logic()                      │
│ Line 60-80                                              │
│ ✓ Extracts ai_enabled from data                        │
│ ✓ Updates database: db.globalsetting.ai_enabled        │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ DATABASE (Prisma/schema.prisma)                         │
│ GlobalSetting.ai_enabled                               │
│ Line 90                                                  │
│ ✓ Persists value (Boolean)                             │
└────────────┬────────────────────────────────────────────┘
             │
     ┌───────┴────────┐
     │                │
     ↓                ↓
┌────────────┐  ┌──────────────────────────────┐
│ FRONTEND   │  │ BACKEND INFERENCE            │
│ (CameraGrid│  │ (video_routes.py)            │
│  .jsx)     │  │ POST /detect                 │
│            │  │ Line 143-155                 │
│ Fetches:   │  │ ✓ Reads ai_enabled from DB  │
│ aiEnabled  │  │ ✓ If false: return []       │
│            │  │ ✓ If true: run YOLO         │
│ Selects:   │  │ ✓ Return detections         │
│ processed  │  └──────────────────────────────┘
│ or         │
│ original   │
│ stream     │
└────────────┘
```

---

## Testing Points

| Component | Location | Line(s) | Test |
|-----------|----------|---------|------|
| **UI Toggle** | CameraNotificationSettings.jsx | 243-247 | Toggle changes displayed |
| **API Post** | settings_routes.py | 14-17 | Network shows POST request |
| **Logic Save** | settings_controller.py | 71-72 | Data extracted correctly |
| **Database** | schema.prisma | 90 | Value persisted |
| **Settings Get** | CameraGrid.jsx | 78-80 | aiEnabled state updated |
| **Stream Prefix** | CameraGrid.jsx | 223, 247 | processed/original selected |
| **Inference Gate** | video_routes.py | 150-157 | Returns empty when false |
| **Inference Run** | video_routes.py | 227 | Runs when true |

---

## Summary

✅ **The toggle IS properly implemented across 7 integration points:**
1. UI component properly wired
2. API route receives data
3. Database logic saves cleanly
4. Database persists value
5. Frontend fetches and uses state
6. Stream selection adapts
7. Inference checks gate before running

**The toggle is WORKING if:**
- You see POST requests in Network tab
- `/detect` returns `detections: []` when disabled
- `/detect` returns actual detections when enabled
- Server logs show "Inference time:" only when enabled
- Stream selector switches between processed/original
