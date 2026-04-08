# Alert System - Fall Detection & Inactivity Alerts

Complete implementation of a 3-tier inactivity alert system with fall detection, database persistence, Socket.IO real-time delivery, and acknowledgement handling.

## System Overview

```
Video Frame
    ↓
YOLO Activity Detection (Person Tracker)
    ↓
State Machine (Track inactivity duration)
    ↓
Threshold Check (5m/15m/30m timings)
    ↓
emit_alert_to_system()
    ├─ Save to eventlog table
    ├─ Emit via Socket.IO
    ├─ Trigger hardware alarm
    └─ Queue dashboard notification
    ↓
Frontend Modal (Priority-based colors)
    ↓
User Clicks ACKNOWLEDGE
    ├─ Socket.IO: ack_alert event
    ├─ REST: POST /api/alerts/{id}/acknowledge
    └─ Hardware alarm stops
```

---

## Implementation Components

### 1. Database Schema

**File**: `server/prisma/schema.prisma`

```prisma
model EventType {
  id        Int       @id @default(autoincrement())
  type_name String    @unique  // "Fall", "Inactivity"
  events    Event[]
}

model EventClass {
  id          Int       @id @default(autoincrement())
  class_name  String    // "Forward Fall", "Inactivity Low", etc.
  event_type_id Int
  event_type  EventType @relation(fields: [event_type_id], references: [id])
  event_logs  EventLog[]
}

model EventLog {
  id             Int        @id @default(autoincrement())
  cam_id         Int
  event_class_id Int
  file_path      String?    // Snapshot URL
  timestamp      DateTime
  event_status   String     // "unacknowledged", "acknowledged"
  created_at     DateTime   @default(now())
  
  event_class    EventClass @relation(fields: [event_class_id], references: [id])
}
```

**Seeding**: `server/seed_db.py`
- EventType: "Fall", "Inactivity"
- EventClass fall: "Forward Fall", "Backward Fall", "Sideward Fall"
- EventClass inactivity: "Inactivity (Low)", "Inactivity (Medium)", "Inactivity (High)"

### 2. PersonTracker Class

**File**: `server/src/workers/processing_worker.py`

Tracks individual people across video frames:

```python
class PersonTracker:
    def __init__(self, tracker_id):
        self.tracker_id = tracker_id
        self.label = None              # Current activity (Standing, Lying Down, etc.)
        self.start_time = 0            # When inactivity began
        self.last_seen = 0             # Last detection timestamp
        self.box = None                # (x1, y1, x2, y2) bounding box
        self.alert_state = None        # Which tier already alerted: "LOW", "MEDIUM", "HIGH"
    
    def update(self, label, current_time, box):
        """Update tracker with new detection."""
        # If activity changed, reset the timer
        if self.label != label:
            self.label = label
            self.start_time = current_time
            self.alert_state = None    # Reset alert state on activity change
```

**Inactivity Tracking**:
- **Activities that trigger inactivity tracking**: Lying Down, Sitting, Eating
- **Activities that reset tracking**: Standing, Walking
- **Falls**: Immediate alert (no delay)

**Inactivity Thresholds**:
- **5 minutes** → Alert: "Inactivity (Low)"
- **15 minutes** → Alert: "Inactivity (Medium)" (if still inactive)
- **30 minutes** → Alert: "Inactivity (High)" (if still inactive)

### 3. Alert Emission

**File**: `server/src/workers/processing_worker.py`

```python
async def emit_alert_to_system(
    camera_id, camera_name, event_class_id, alert_priority,
    snapshot_url, timestamp, socketio
):
    """Emit alert to database, Socket.IO, and hardware alarm."""
    
    # Save to database
    event_log = await db.eventlog.create({
        "cam_id": camera_id,
        "event_class_id": event_class_id,
        "file_path": snapshot_url,
        "timestamp": datetime.fromisoformat(timestamp),
        "event_status": "unacknowledged"
    })
    
    # Format alert data
    alert_data = {
        "alert_id": event_log.id,
        "camera_id": camera_id,
        "camera_name": camera_name,
        "event_class_id": event_class_id,
        "alert_priority": alert_priority,  # "critical", "high", "medium", "low"
        "snapshot_url": snapshot_url,
        "timestamp": timestamp
    }
    
    # Emit via Socket.IO
    socketio.emit("new_alert", alert_data, broadcast=True)
    
    # Trigger hardware alarm
    hardware_alert.trigger_alert(location=camera_name)
```

### 4. Socket.IO Event Handler

**File**: `server/src/services/socket_manager.py`

```python
@socketio_server.on('ack_alert')
async def handle_ack_alert(data):
    """Handle alert acknowledgement from frontend."""
    alert_id = data.get('alert_id')
    
    # Update database
    await db.eventlog.update(
        where={"id": alert_id},
        data={"event_status": "acknowledged"}
    )
    
    # Stop hardware alarm
    hardware_alert.stop_alarm()
    
    # Broadcast acknowledgement
    socketio_server.emit("alert_acknowledged", {
        "alert_id": alert_id,
        "timestamp": datetime.now().isoformat()
    }, broadcast=True)
```

### 5. REST Acknowledgement Endpoint

**File**: `server/src/routes/event_routes.py`

```python
@router.post('/alerts/{alert_id}/acknowledge')
async def acknowledge_alert(
    alert_id: int,
    request: Request,
    user_id: str = Depends(require_user_id)
):
    """Fallback HTTP endpoint for alert acknowledgement."""
    event_log = await db.eventlog.update(
        where={"id": alert_id},
        data={"event_status": "acknowledged"}
    )
    hardware_alert.stop_alarm()
    return {"status": "acknowledged", "alert_id": alert_id}
```

### 6. Frontend Alert Modal

**File**: `client/src/components/GlobalAlertModal.jsx`

Priority-based color scheme:

| Priority | Activities | Color | Icon | Urgency |
|----------|-----------|-------|------|---------|
| CRITICAL | Fall (any direction) | 🔴 RED | 🚨 | ⚠️ IMMEDIATE |
| HIGH | Inactivity (High - 30min+) | 🟠 ORANGE | ⚠️ | ⚠️ URGENT |
| MEDIUM | Inactivity (Medium - 15min+) | 🟡 YELLOW | ℹ️ | ⚠️ ATTENTION |
| LOW | Inactivity (Low - 5min+) | 🔵 BLUE | ℹ️ | ℹ️ INFO |

```jsx
function GlobalAlertModal({ alert, isOpen, onClose }) {
    const { type, priority } = alert || {};
    const styles = getPriorityStyles(priority, type);
    
    return (
        <Modal isOpen={isOpen} className={`border-4 ${styles.borderColor}`}>
            <div className={`bg-gradient-to-r ${styles.gradient}`}>
                <h2 className={styles.textColor}>{styles.icon} {alert?.title}</h2>
                <p>{alert?.location}</p>
                <p>{alert?.message}</p>
            </div>
            <button onClick={handleAlertClose}>ACKNOWLEDGE</button>
        </Modal>
    );
}
```

### 7. Alert Acknowledgement Handler

**File**: `client/src/features/camera/CameraGrid.jsx`

```javascript
const handleAlertClose = async (alert_id) => {
    try {
        // Socket.IO (primary)
        socket.emit('ack_alert', { alert_id, user_id: userId });
        
        // REST fallback
        await fetch(`/api/alerts/${alert_id}/acknowledge`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setAlert(null);
    } catch (err) {
        console.error('Failed to acknowledge alert:', err);
    }
};
```

---

## Alert Priority Mapping

### Database-to-Frontend Mapping

**Backend sends** `event_class_id` → **Frontend looks up** priority:

```javascript
const EVENT_PRIORITY_MAP = {
    // Falls (immediate, critical)
    'Forward Fall': 'critical',
    'Backward Fall': 'critical', 
    'Sideward Fall': 'critical',
    
    // Inactivity (tiered by time)
    'Inactivity (High)': 'high',      // 30+ minutes
    'Inactivity (Medium)': 'medium',  // 15+ minutes
    'Inactivity (Low)': 'low',        // 5+ minutes
};
```

---

## Configuration

### Environment Variables

```env
# Activity Detection Model (optional)
MODEL_PATH=/path/to/openvino/model

# OpenVINO Device (GPU accelerated if available)
OPENVINO_DEVICE=HETERO:GPU,CPU

# Hardware Alarm Trigger (if connected)
ALARM_ENABLED=true
ALARM_GPIO_PIN=17
ALARM_SPI_DEVICE=/dev/spidev0.0
```

### Processing Worker Startup

```bash
python src/workers/processing_worker.py \
  --src "rtsp://user:pass@camera.ip/stream" \
  --target "rtsp://localhost:8554/processed/cam1" \
  --camera_id 1 \
  --camera_name "Main Hallway" \
  --model "/path/to/openvino/model"
```

---

## Testing the Alert System

### Quick Smoke Test

```bash
# 1. Backend running
python -m uvicorn app:app --reload

# 2. Frontend running  
npm run dev

# 3. Inject test alert (Python script)
python -c "
import asyncio
from datetime import datetime
from src.db import db
from src.workers.processing_worker import emit_alert_to_system

async def test():
    await emit_alert_to_system(
        camera_id=1,
        camera_name='Test Camera',
        event_class_id=1,  # Fall
        snapshot_url='/snapshots/test.jpg',
        timestamp=datetime.now().isoformat()
    )

asyncio.run(test())
"

# 4. Check frontend - alert modal should appear
# 5. Click ACKNOWLEDGE - event_status should change to "acknowledged"
```

### Database Verification

```sql
SELECT id, cam_id, event_class_id, event_status, timestamp 
FROM eventlog 
WHERE created_at > NOW() - INTERVAL 5 MINUTES
ORDER BY created_at DESC;
```

Expected output:
```
 id | cam_id | event_class_id | event_status     | timestamp
----+--------+----------------+------------------+------------------
  1 |      1 |              1 | acknowledged     | 2026-04-09...
```

---

## Troubleshooting

### Alert Not Appearing on Frontend

1. **Check Socket.IO connection**: 
   - DevTools → Console → Filter: `[SocketIO]`
   - Should see `Connected` message

2. **Check database alert saved**:
   ```sql
   SELECT * FROM eventlog ORDER BY created_at DESC LIMIT 1;
   ```

3. **Check Socket.IO event delivery**:
   - Server logs: `[processing_worker.py]`
   - Should see: `socketio.emit("new_alert", ...)`

### Acknowledgement Not Working

1. **Check Socket.IO handler**:
   - Server logs should show: `@socketio_server.on('ack_alert')`

2. **Check REST fallback**:
   ```bash
   curl -X POST http://localhost:5000/api/alerts/1/acknowledge
   ```

3. **Check database update**:
   ```sql
   SELECT event_status FROM eventlog WHERE id = 1;
   ```
   Should return `"acknowledged"`

---

## Future Enhancements

- [ ] Alert history page with filters
- [ ] Custom alert thresholds per camera
- [ ] Integration with mobile push notifications
- [ ] Email/SMS escalation if unacknowledged > X minutes
- [ ] Hardware alarm integration (GPIO/relay)
- [ ] Export alerts to CSV/PDF reports
