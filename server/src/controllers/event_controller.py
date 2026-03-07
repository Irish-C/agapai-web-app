from database import db
from datetime import datetime

async def create_event_logic(data):
    try:
        # 1. Use 'eventlog' (lowercase of model name EventLog)
        # 2. Use schema field names: cam_id and file_path
        new_event = await db.eventlog.create(
            data={
                'cam_id': int(data['camera_id']),
                'event_class_id': int(data['event_class_id']),
                'timestamp': datetime.now(),
                'file_path': data.get('snapshot_url', '')
            },
            include={
                'camera': True,
                'event_class': True
            }
        )

        # Use the socketio_server instance defined in app.py
        from app import socketio_server 
        payload = {
            'id': str(new_event.id),
            'type': new_event.event_class.class_name,
            'location': new_event.camera.cam_name,
            'timestamp': new_event.timestamp.isoformat(),
            'snapshot_url': new_event.file_path
        }
        # Emit alert to frontend
        await socketio_server.emit('new_alert', payload)

        return {"status": "success", "data": payload}, 201
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

async def get_event_logs_logic(filters=None):
    try:
        logs = await db.eventlog.find_many(
            order={'timestamp': 'desc'},
            include={'camera': True, 'event_class': True}
        )
        return {"status": "success", "data": logs}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

async def mark_viewed_logic(log_id, user_id):
    try:
        await db.eventlog.update(
            where={'id': int(log_id)},
            data={
                'ack_by_user_id': int(user_id),
                'event_status': 'acknowledged'
            }
        )
        return {"status": "success", "message": "Event acknowledged"}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500