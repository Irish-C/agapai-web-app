from database import db
from datetime import datetime
from src.utils.role_utils import normalize_role

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
            'location': new_event.camera.cam_name if new_event.camera else 'Unknown',
            'timestamp': new_event.timestamp.isoformat(),
            'snapshot_url': new_event.file_path,
            'status': 'unacknowledged'
        }
        # Emit alert to frontend
        await socketio_server.emit('new_alert', payload)

        return {"status": "success", "data": payload}, 201
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

async def get_event_types_logic():
    try:
        # Using Prisma to get unique event classifications from your DB
        # Replace 'event_log' with your actual model name if different
        types = await db.event_log.find_many(
            distinct=['event_class_name'],
            select={'event_class_name': True}
        )
        
        # Format the list for the frontend pills
        return [{"name": t['event_class_name']} for t in types]
    except Exception as e:
        print(f"Error fetching types: {e}")
        return []

async def get_event_logs_logic(filters=None):
    try:
        # Get limit from filters, default to 50 if not provided
        limit = int(filters.get('limit', 50)) if filters else 50
        
        logs = await db.eventlog.find_many(
            take=limit, # Use the limit here
            order={'timestamp': 'desc'},
            include={'camera': True, 'event_class': True}
        )
        
        # Convert BigInt and DateTime to strings for JSON
        formatted_data = []
        for log in logs:
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": log.camera.cam_name if log.camera else "Unknown",
                "timestamp": log.timestamp.isoformat(),
                "snapshot_url": log.file_path,
                "status": log.event_status
            })
            
        return {"status": "success", "report": formatted_data}, 200
    except Exception as e:
        print(f"Error: {e}")
        return {"status": "error", "message": str(e)}, 500

async def get_viewed_event_logs_logic(filters=None):
    try:
        # Get limit from filters, default to 50 if not provided
        limit = int(filters.get('limit', 50)) if filters else 50
        
        logs = await db.eventlog.find_many(
            take=limit, # Use the limit here
            order={'timestamp': 'desc'},
            include={'camera': True, 'event_class': True}
        )
        
        # Convert BigInt and DateTime to strings for JSON
        formatted_data = []
        for log in logs:
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": log.camera.cam_name if log.camera else "Unknown",
                "timestamp": log.timestamp.isoformat(),
                "snapshot_url": log.file_path,
                "status": log.event_status
            })
            
        return {"status": "success", "report": formatted_data}, 200
    except Exception as e:
        print(f"Error: {e}")
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

async def get_event_types():
    try:
        # Fetch unique types/classes from your database using Prisma or SQL
        # Replace 'event_log' with your actual table name
        types = await db.event_log.find_many(
            distinct=['event_class_name'],
            select={'event_class_name': True}
        )
        
        # Format for the frontend: [{'name': 'Fall'}, {'name': 'Inactivity'}]
        formatted_types = [{"name": t['event_class_name']} for t in types]
        
        return formatted_types
    except Exception as e:
        print(f"Error fetching types: {e}")
        return []

async def export_logs_by_date_logic(date_str: str):
    """Export all incident logs for a specific date as JSON"""
    try:
        from datetime import datetime, timedelta, timezone
        
        # Parse the date string (YYYY-MM-DD) in user's local timezone context
        target_date = datetime.strptime(date_str, '%Y-%m-%d')
        
        # Create start and end of day in UTC (database stores UTC timestamps)
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        print(f"[export_logs] Querying for date: {date_str}")
        print(f"[export_logs] Start: {start_of_day}, End: {end_of_day}")
        
        # Query all events for that day
        logs = await db.eventlog.find_many(
            where={
                'timestamp': {
                    'gte': start_of_day,
                    'lt': end_of_day
                }
            },
            order={'timestamp': 'desc'},
            include={'camera': True, 'event_class': True}
        )
        
        print(f"[export_logs] Found {len(logs)} events for {date_str}")
        
        # Format the data
        formatted_data = []
        for log in logs:
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": log.camera.cam_name if log.camera else "Unknown",
                "timestamp": log.timestamp.isoformat(),
                "snapshot_url": log.file_path,
                "status": log.event_status
            })
        
        total_count = len(formatted_data)
        return {
            "status": "success",
            "date": date_str,
            "total_events": total_count,
            "events": formatted_data
        }, 200
        
    except ValueError as e:
        return {"status": "error", "message": "Invalid date format. Use YYYY-MM-DD"}, 400
    except Exception as e:
        print(f"Error exporting logs: {e}")
        return {"status": "error", "message": str(e)}, 500


async def get_missed_alerts_logic(timestamp_ms: int):
    """Fetch alerts that occurred since a specific timestamp (milliseconds).
    
    Used by frontend to sync missed YOLO detections after Socket.IO reconnect.
    Returns alerts that should have been emitted but client was offline.
    
    Args:
        timestamp_ms: Unix timestamp in milliseconds when client last saw an alert
        
    Returns:
        {
            "status": "success",
            "count": int,
            "alerts": [
                {
                    "id": str,
                    "type": str (class_name),
                    "location": str (camera name),
                    "timestamp": ISO string,
                    "snapshot_url": str,
                    "status": str
                },
                ...
            ]
        }
    """
    try:
        from datetime import datetime
        
        # Convert milliseconds to datetime
        since_datetime = datetime.utcfromtimestamp(timestamp_ms / 1000.0)
        
        print(f"[get_missed_alerts] Fetching alerts since {since_datetime.isoformat()}")
        
        # Query alerts created since the timestamp (order newest first for priority)
        alerts = await db.eventlog.find_many(
            where={
                'timestamp': {
                    'gt': since_datetime  # Greater than (strict) to avoid duplicates
                }
            },
            order={'timestamp': 'desc'},  # Newest first
            include={'camera': True, 'event_class': True}
        )
        
        print(f"[get_missed_alerts] Found {len(alerts)} missed alerts")
        
        # Format the data to match Socket.IO 'new_alert' payload
        formatted_alerts = []
        for alert in alerts:
            formatted_alerts.append({
                'id': str(alert.id),
                'type': alert.event_class.class_name if alert.event_class else 'unknown',
                'location': alert.camera.cam_name if alert.camera else 'Unknown',
                'timestamp': alert.timestamp.isoformat(),
                'snapshot_url': alert.file_path,
                'status': alert.event_status or 'unacknowledged'
            })
        
        return {
            'status': 'success',
            'count': len(formatted_alerts),
            'alerts': formatted_alerts
        }, 200
        
    except Exception as e:
        print(f"Error fetching missed alerts: {e}")
        return {'status': 'error', 'message': str(e)}, 500