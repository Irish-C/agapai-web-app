from database import db
from datetime import datetime, timedelta
from src.utils.role_utils import normalize_role


def _location_label(camera_obj):
    if camera_obj and getattr(camera_obj, 'location', None) and getattr(camera_obj.location, 'loc_name', None):
        return camera_obj.location.loc_name
    if camera_obj and getattr(camera_obj, 'cam_name', None):
        return camera_obj.cam_name
    return "Unknown"

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

        # Use the socketio_server instance from socket_manager
        from src.services.socket_manager import socketio_server 
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
        # Fetch classifications from EventClass table (source of truth).
        classes = await db.eventclass.find_many(order={'class_name': 'asc'})
        return [{"name": c.class_name} for c in classes if getattr(c, 'class_name', None)]
    except Exception as e:
        print(f"Error fetching types: {e}")
        return []

async def get_event_logs_logic(filters=None):
    try:
        # Get limit from filters, default to 50 if not provided
        limit = int(filters.get('limit', 50)) if filters else 50

        where_clause = {}
        if filters:
            start_date = filters.get('start_date')
            end_date = filters.get('end_date')
            tz_offset_minutes = int(filters.get('tz_offset_minutes', 0) or 0)

            if start_date or end_date:
                timestamp_filter = {}

                if start_date:
                    local_start = datetime.strptime(start_date, '%Y-%m-%d').replace(
                        hour=0,
                        minute=0,
                        second=0,
                        microsecond=0,
                    )
                    # JS getTimezoneOffset() is minutes to add to local time to get UTC.
                    start_dt = local_start + timedelta(minutes=tz_offset_minutes)
                    timestamp_filter['gte'] = start_dt

                if end_date:
                    # Include full end date in local time, converted to UTC as exclusive upper bound.
                    local_end = datetime.strptime(end_date, '%Y-%m-%d').replace(
                        hour=0,
                        minute=0,
                        second=0,
                        microsecond=0,
                    ) + timedelta(days=1)
                    end_dt = local_end + timedelta(minutes=tz_offset_minutes)
                    timestamp_filter['lt'] = end_dt

                if timestamp_filter.get('gte') and timestamp_filter.get('lt') and timestamp_filter['gte'] >= timestamp_filter['lt']:
                    return {"status": "error", "message": "start_date must be on or before end_date"}, 400

                where_clause['timestamp'] = timestamp_filter
        
        logs = await db.eventlog.find_many(
            take=limit, # Use the limit here
            where=where_clause,
            order={'timestamp': 'desc'},
            include={'camera': {'include': {'location': True}}, 'event_class': True, 'acknowledged_by': True}
        )
        
        # Sort by unacknowledged first, then acknowledged, with most recent timestamps first within each group
        unacknowledged = [log for log in logs if log.event_status == 'unacknowledged']
        acknowledged = [log for log in logs if log.event_status == 'acknowledged']
        
        # Sort each group by timestamp (most recent first) and combine
        unacknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        acknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        sorted_logs = unacknowledged + acknowledged
        
        # Convert BigInt and DateTime to strings for JSON
        formatted_data = []
        for log in sorted_logs:
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": _location_label(log.camera),
                "timestamp": log.timestamp.isoformat(),
                "snapshot_url": log.file_path,
                "status": log.event_status,
                "acknowledged_by_username": log.acknowledged_by.username if log.acknowledged_by else None
            })
            
        return {"status": "success", "report": formatted_data}, 200
    except ValueError:
        return {"status": "error", "message": "Invalid date format. Use YYYY-MM-DD"}, 400
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
            include={'camera': {'include': {'location': True}}, 'event_class': True}
        )
        
        # Sort by unacknowledged first, then acknowledged, with most recent timestamps first within each group
        unacknowledged = [log for log in logs if log.event_status == 'unacknowledged']
        acknowledged = [log for log in logs if log.event_status == 'acknowledged']
        
        # Sort each group by timestamp (most recent first) and combine
        unacknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        acknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        sorted_logs = unacknowledged + acknowledged
        
        # Convert BigInt and DateTime to strings for JSON
        formatted_data = []
        for log in sorted_logs:
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": _location_label(log.camera),
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

async def mark_unviewed_logic(log_id, user_id):
    try:
        existing_log = await db.eventlog.find_unique(where={'id': int(log_id)})
        if not existing_log:
            return {"status": "error", "message": "Event not found"}, 404

        # Only the original acknowledger may unacknowledge this event.
        if existing_log.ack_by_user_id is None or int(existing_log.ack_by_user_id) != int(user_id):
            return {
                "status": "error",
                "message": "Only the user who acknowledged this event can unacknowledge it"
            }, 403

        await db.eventlog.update(
            where={'id': int(log_id)},
            data={
                'ack_by_user_id': None,
                'event_status': 'unacknowledged'
            }
        )
        return {"status": "success", "message": "Event unacknowledged"}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

async def get_event_types():
    try:
        classes = await db.eventclass.find_many(order={'class_name': 'asc'})
        return [{"name": c.class_name} for c in classes if getattr(c, 'class_name', None)]
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
            include={'camera': {'include': {'location': True}}, 'event_class': True}
        )
        
        print(f"[export_logs] Found {len(logs)} events for {date_str}")
        
        # Format the data
        formatted_data = []
        for log in logs:
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": _location_label(log.camera),
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
            include={'camera': {'include': {'location': True}}, 'event_class': True}
        )
        
        print(f"[get_missed_alerts] Found {len(alerts)} missed alerts")
        
        # Format the data to match Socket.IO 'new_alert' payload
        formatted_alerts = []
        for alert in alerts:
            formatted_alerts.append({
                'id': str(alert.id),
                'type': alert.event_class.class_name if alert.event_class else 'unknown',
                'location': _location_label(alert.camera),
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