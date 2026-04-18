from database import db
from datetime import datetime, timedelta, timezone
from src.utils.role_utils import normalize_role
import json


def _location_label(camera_obj):
    if camera_obj and getattr(camera_obj, 'location', None) and getattr(camera_obj.location, 'loc_name', None):
        return camera_obj.location.loc_name
    if camera_obj and getattr(camera_obj, 'cam_name', None):
        return camera_obj.cam_name
    return "Unknown"


async def create_event_logic(data):
    try:
        event_class_id = int(data.get('event_class_id', 1))
        class_name = data.get('class_name')
        camera_id = int(data['camera_id'])
        snapshot_filename = data.get('snapshot_filename', '')
        location_name = data.get('location_name', 'Unknown')
        
        print(f"\n[EVENT_CREATE] START")
        print(f"  Camera ID: {camera_id}")
        print(f"  Location: {location_name}")
        print(f"  Snapshot: {snapshot_filename}")
        
        if class_name:
            print(f"  [LOOKUP] Searching for class_name='{class_name}'...")
            event_class = await db.eventclass.find_first(where={'class_name': class_name})
            if event_class:
                old_id = event_class_id
                event_class_id = event_class.id
                print(f"  [LOOKUP] ✓ FOUND: event_class_id {old_id} → {event_class_id}")
            else:
                print(f"  [LOOKUP] ✗ NOT FOUND in database! Using default event_class_id={event_class_id}")
        
        # Check for recent matching incident (within 60 seconds)
        time_window = datetime.now(timezone.utc) - timedelta(seconds=60)
        
        print(f"  [DEDUP] Checking for recent events:")
        print(f"    - Camera ID: {camera_id}")
        print(f"    - Event Class ID: {event_class_id}")
        print(f"    - Time window: {time_window} to now")
        
        recent_event = await db.eventlog.find_first(
            where={
                'cam_id': camera_id,
                'event_class_id': event_class_id,
                'timestamp': {'gte': time_window},
                'deleted_at': None  # Exclude soft-deleted events
            },
            order={'timestamp': 'desc'}
        )
        
        if recent_event:
            # Accumulate snapshot to existing event
            print(f"  [DEDUP] Found recent event (ID={recent_event.id})")
            
            if snapshot_filename:
                # Create snapshot record
                await db.snapshot.create(
                    data={
                        'filename': snapshot_filename,
                        'event_log_id': recent_event.id,
                        'timestamp': datetime.now(timezone.utc)
                    }
                )
                print(f"  [SNAPSHOT] Created snapshot record: {snapshot_filename}")
            
            # Get all snapshots for this event
            updated_event = await db.eventlog.find_unique(
                where={'id': recent_event.id},
                include={
                    'camera': {'include': {'location': True}},
                    'event_class': True,
                    'snapshots': {'orderBy': {'timestamp': 'asc'}}
                }
            )
            
            snapshot_urls = [f"http://localhost:3000/api/snapshots/{s.filename}" for s in updated_event.snapshots]
            display_snapshot_url = snapshot_urls[0] if snapshot_urls else None
            
            location_display = _location_label(updated_event.camera)
            
            payload = {
                'id': str(updated_event.id),
                'type': updated_event.event_class.class_name,
                'location': location_display,
                'timestamp': updated_event.timestamp.isoformat(),
                'snapshot_url': display_snapshot_url,
                'all_snapshots': snapshot_urls,
                'occurrence_count': len(snapshot_urls),
                'status': 'unacknowledged'
            }
            print(f"  [STORED] Updated EventLog ID={updated_event.id}, snapshots={len(snapshot_urls)}")
            print(f"[EVENT_CREATE] END\n")
            
            from src.services.socket_manager import socketio_server
            await socketio_server.emit('alert_accumulated', payload)
            
            return {"status": "success", "data": payload, "accumulated": True}, 200
        else:
            # Create new event
            new_event = await db.eventlog.create(
                data={
                    'cam_id': camera_id,
                    'event_class_id': event_class_id,
                    'timestamp': datetime.now(timezone.utc)
                },
                include={
                    'camera': {'include': {'location': True}},
                    'event_class': True
                }
            )
            
            snapshot_urls = []
            if snapshot_filename:
                # Create snapshot record
                await db.snapshot.create(
                    data={
                        'filename': snapshot_filename,
                        'event_log_id': new_event.id,
                        'timestamp': datetime.now(timezone.utc)
                    }
                )
                snapshot_urls = [f"http://localhost:3000/api/snapshots/{snapshot_filename}"]
                print(f"  [SNAPSHOT] Created snapshot record: {snapshot_filename}")
            
            location_display = _location_label(new_event.camera)
            
            payload = {
                'id': str(new_event.id),
                'type': new_event.event_class.class_name,
                'location': location_display,
                'timestamp': new_event.timestamp.isoformat(),
                'snapshot_url': snapshot_urls[0] if snapshot_urls else None,
                'all_snapshots': snapshot_urls,
                'occurrence_count': len(snapshot_urls),
                'status': 'unacknowledged'
            }
            print(f"  [CREATED] New EventLog ID={new_event.id}")
            print(f"[EVENT_CREATE] END\n")
            
            from src.services.socket_manager import socketio_server
            await socketio_server.emit('new_alert', payload)

            return {"status": "success", "data": payload, "accumulated": False}, 201
    except Exception as e:
        import traceback
        print(f"[EVENT_CREATE] ERROR: {str(e)}")
        print(traceback.format_exc())
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
        limit = int(filters.get('limit', 50)) if filters else 50
        where_clause = {'deleted_at': None}  # Exclude soft-deleted events
        
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
                    start_dt = local_start + timedelta(minutes=tz_offset_minutes)
                    timestamp_filter['gte'] = start_dt

                if end_date:
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
            take=limit,
            where=where_clause,
            order={'timestamp': 'desc'},
            include={
                'camera': {'include': {'location': True}},
                'event_class': True,
                'acknowledged_by': True,
                'snapshots': {'orderBy': {'timestamp': 'asc'}}
            }
        )
        
        unacknowledged = [log for log in logs if log.event_status == 'unacknowledged']
        acknowledged = [log for log in logs if log.event_status == 'acknowledged']
        unacknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        acknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        sorted_logs = unacknowledged + acknowledged
        
        formatted_data = []
        for log in sorted_logs:
            snapshot_urls = [f"http://localhost:3000/api/snapshots/{s.filename}" for s in log.snapshots]
            
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": _location_label(log.camera),
                "timestamp": log.timestamp.isoformat(),
                "snapshot_url": snapshot_urls[0] if snapshot_urls else None,
                "all_snapshots": snapshot_urls,
                "occurrence_count": len(snapshot_urls),
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
        limit = int(filters.get('limit', 50)) if filters else 50
        
        logs = await db.eventlog.find_many(
            take=limit,
            where={'deleted_at': None},  # Exclude soft-deleted events
            order={'timestamp': 'desc'},
            include={
                'camera': {'include': {'location': True}},
                'event_class': True,
                'snapshots': {'orderBy': {'timestamp': 'asc'}}
            }
        )
        
        unacknowledged = [log for log in logs if log.event_status == 'unacknowledged']
        acknowledged = [log for log in logs if log.event_status == 'acknowledged']
        unacknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        acknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        sorted_logs = unacknowledged + acknowledged
        
        formatted_data = []
        for log in sorted_logs:
            snapshot_urls = [f"http://localhost:3000/api/snapshots/{s.filename}" for s in log.snapshots]
            
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": _location_label(log.camera),
                "timestamp": log.timestamp.isoformat(),
                "snapshot_url": snapshot_urls[0] if snapshot_urls else None,
                "all_snapshots": snapshot_urls,
                "occurrence_count": len(snapshot_urls),
                "status": log.event_status
            })
        
        return {"status": "success", "report": formatted_data}, 200
    except Exception as e:
        print(f"Error: {e}")
        return {"status": "error", "message": str(e)}, 500

async def mark_viewed_logic(log_id, user_id):
    try:
        print(f"[ACKNOWLEDGE] Start - log_id={log_id}, user_id={user_id}")
        
        result = await db.eventlog.update(
            where={'id': int(log_id)},
            data={
                'ack_by_user_id': int(user_id),
                'event_status': 'acknowledged'
            }
        )
        
        print(f"[ACKNOWLEDGE] ✓ Success - Event {log_id} acknowledged by user {user_id}")
        return {"status": "success", "message": "Event acknowledged"}, 200
    except Exception as e:
        print(f"[ACKNOWLEDGE] ✗ Error: {e}")
        return {"status": "error", "message": str(e)}, 500

async def mark_unviewed_logic(log_id, user_id):
    try:
        print(f"[UNACKNOWLEDGE] Start - log_id={log_id}, user_id={user_id}")
        
        existing_log = await db.eventlog.find_unique(where={'id': int(log_id)})
        if not existing_log:
            print(f"[UNACKNOWLEDGE] ✗ Event not found with id={log_id}")
            return {"status": "error", "message": "Event not found"}, 404

        # Only the original acknowledger may unacknowledge this event.
        if existing_log.ack_by_user_id is None or int(existing_log.ack_by_user_id) != int(user_id):
            print(f"[UNACKNOWLEDGE] ✗ User {user_id} cannot unacknowledge (ack_by_user_id={existing_log.ack_by_user_id})")
            return {
                "status": "error",
                "message": "Only the user who acknowledged this event can unacknowledge it"
            }, 403

        result = await db.eventlog.update(
            where={'id': int(log_id)},
            data={
                'ack_by_user_id': None,
                'event_status': 'unacknowledged'
            }
        )
        
        print(f"[UNACKNOWLEDGE] ✓ Success - Event {log_id} unacknowledged")
        return {"status": "success", "message": "Event unacknowledged"}, 200
    except Exception as e:
        print(f"[UNACKNOWLEDGE] ✗ Error: {e}")
        return {"status": "error", "message": str(e)}, 500

async def delete_event_logic(log_id):
    """Soft delete an event by setting deleted_at timestamp"""
    try:
        print(f"[DELETE EVENT] Start - log_id={log_id}")
        
        # Check if event exists
        existing_log = await db.eventlog.find_unique(where={'id': int(log_id)})
        if not existing_log:
            print(f"[DELETE EVENT] ✗ Event not found with id={log_id}")
            return {"status": "error", "message": "Event not found"}, 404

        # Soft delete: set deleted_at timestamp
        deleted_event = await db.eventlog.update(
            where={'id': int(log_id)},
            data={'deleted_at': datetime.now(timezone.utc)}
        )
        
        print(f"[DELETE EVENT] ✓ Success - Event {log_id} soft-deleted")
        return {"status": "success", "message": "Event deleted successfully"}, 200
    except Exception as e:
        print(f"[DELETE EVENT] ✗ Error: {e}")
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
        
        # Query all events for that day (excluding soft-deleted)
        logs = await db.eventlog.find_many(
            where={
                'timestamp': {
                    'gte': start_of_day,
                    'lt': end_of_day
                },
                'deleted_at': None  # Exclude soft-deleted events
            },
            order={'timestamp': 'desc'},
            include={
                'camera': {'include': {'location': True}},
                'event_class': True,
                'snapshots': {'orderBy': {'timestamp': 'asc'}}
            }
        )
        
        print(f"[export_logs] Found {len(logs)} events for {date_str}")
        
        # Format the data
        formatted_data = []
        for log in logs:
            snapshot_urls = [f"http://localhost:3000/api/snapshots/{s.filename}" for s in log.snapshots]
            
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": _location_label(log.camera),
                "timestamp": log.timestamp.isoformat(),
                "snapshot_url": snapshot_urls[0] if snapshot_urls else None,
                "all_snapshots": snapshot_urls,
                "occurrence_count": len(snapshot_urls),
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