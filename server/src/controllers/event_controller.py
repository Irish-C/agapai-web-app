from database import db
from datetime import datetime

# 1. New Event Logic (For the POST /events route)
async def create_event_logic(data):
    try:
        new_event = await db.event.create(
            data={
                'camera_id': int(data['camera_id']),
                'event_class_id': int(data['event_class_id']),
                'timestamp': datetime.now(),
                'snapshot_url': data.get('snapshot_url', '')
            },
            include={
                'camera': True,
                'event_class': True
            }
        )

        from app import socketio 
        payload = {
            'id': str(new_event.id),
            'type': new_event.event_class.class_name,
            'location': new_event.camera.cam_name,
            'timestamp': new_event.timestamp.isoformat(),
            'snapshot_url': new_event.snapshot_url
        }
        socketio.emit('new_alert', payload)

        return {"status": "success", "data": payload}, 201
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

# 2. THE MISSING FUNCTION: Get Event Logs Logic
async def get_event_logs_logic(filters=None):
    try:
        # Simple fetch; you can expand this with prisma filters later
        logs = await db.event.find_many(
            order={'timestamp': 'desc'},
            include={'camera': True, 'event_class': True}
        )
        return {"status": "success", "data": logs}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

# 3. Mark Viewed/Acknowledge Logic
async def mark_viewed_logic(log_id, user_id):
    try:
        await db.event.update(
            where={'id': int(log_id)},
            data={'acknowledged_by': int(user_id), 'acknowledged_at': datetime.now()}
        )
        return {"status": "success", "message": "Event acknowledged"}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500