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


def _parse_snapshot_data(file_path_str):
    """Parse snapshot data from file_path field (which stores JSON).
    
    Returns:
        dict: {"snapshots": [], "count": int, "first_snapshot": str} or 
              None if file_path is a simple URL string.
    """
    if not file_path_str:
        return None
    
    try:
        data = json.loads(file_path_str)
        if isinstance(data, dict) and 'snapshots' in data:
            return data
    except (json.JSONDecodeError, ValueError):
        pass
    
    return None


def _serialize_snapshot_data(snapshots, first_snapshot=None):
    """Serialize snapshot data as JSON for storage in file_path field.
    
    Args:
        snapshots: list of snapshot URLs
        first_snapshot: URL of the first snapshot (for display)
    
    Returns:
        str: JSON string
    """
    data = {
        "snapshots": snapshots,
        "count": len(snapshots),
        "first_snapshot": first_snapshot or (snapshots[0] if snapshots else None)
    }
    return json.dumps(data)


async def create_event_logic(data):
    try:
        # 1. If class_name is provided, look up the correct event_class_id from database
        # 2. Otherwise use the provided event_class_id
        event_class_id = int(data.get('event_class_id', 1))
        class_name = data.get('class_name')
        camera_id = int(data['camera_id'])
        snapshot_url = data.get('snapshot_url', '')
        
        print(f"\n[EVENT_CREATE] START")
        print(f"  Incoming data: {data}")
        print(f"  class_name from data: '{class_name}' (type: {type(class_name).__name__})")
        print(f"  event_class_id from data: {data.get('event_class_id')}")
        
        if class_name:
            print(f"  [LOOKUP] Searching for class_name='{class_name}'...")
            # Look up the EventClass by name to get the correct ID
            event_class = await db.eventclass.find_first(where={'class_name': class_name})
            if event_class:
                old_id = event_class_id
                event_class_id = event_class.id
                print(f"  [LOOKUP] ✓ FOUND: event_class_id {old_id} → {event_class_id}")
            else:
                print(f"  [LOOKUP] ✗ NOT FOUND in database! Using default event_class_id={event_class_id}")
        else:
            print(f"  [LOOKUP] No class_name provided, using event_class_id={event_class_id}")
        
        # Check for recent matching incident (within 60 seconds for accumulation)
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
            },
            order={'timestamp': 'desc'}
        )
        
        if recent_event:
            print(f"  [DEDUP] ✓ Found recent event (ID={recent_event.id}, status={recent_event.event_status})")
            print(f"         Last event timestamp: {recent_event.timestamp}")
            print(f"         Current timestamp: {datetime.now(timezone.utc)}")
            print(f"         Time diff: {(datetime.now(timezone.utc) - recent_event.timestamp).total_seconds()}s")
            
            # Accumulate snapshots
            existing_data = _parse_snapshot_data(recent_event.file_path)
            
            if existing_data:
                # Already accumulated format
                existing_snapshots = existing_data.get('snapshots', [])
                first_snapshot = existing_data.get('first_snapshot', snapshot_url)
            else:
                # First accumulation (upgrade from single URL)
                existing_snapshots = [recent_event.file_path] if recent_event.file_path else []
                first_snapshot = recent_event.file_path if recent_event.file_path else snapshot_url
            
            # Add new snapshot if different
            if snapshot_url and snapshot_url not in existing_snapshots:
                existing_snapshots.append(snapshot_url)
            
            # Serialize updated data
            file_path_json = _serialize_snapshot_data(existing_snapshots, first_snapshot)
            
            # Update the existing event
            updated_event = await db.eventlog.update(
                where={'id': recent_event.id},
                data={'file_path': file_path_json},
                include={
                    'camera': {'include': {'location': True}},
                    'event_class': True
                }
            )
            
            print(f"  [DEDUP] Updated accumulation: {len(existing_snapshots)} snapshots")
            
            # Prepare display snapshot_url for frontend
            parsed = _parse_snapshot_data(updated_event.file_path)
            display_snapshot_url = parsed['first_snapshot'] if parsed else updated_event.file_path
            
            from src.services.socket_manager import socketio_server 
            
            # Determine location - try location first, fall back to camera name, then ID
            location_display = 'Unknown'
            if updated_event.camera:
                if updated_event.camera.location and updated_event.camera.location.loc_name:
                    location_display = updated_event.camera.location.loc_name
                    print(f"  [LOCATION] ✓ Using location: {location_display}")
                elif updated_event.camera.cam_name:
                    location_display = updated_event.camera.cam_name
                    print(f"  [LOCATION] Using camera name: {location_display}")
                else:
                    location_display = f"Camera {updated_event.camera.id}"
                    print(f"  [LOCATION] Using camera ID: {location_display}")
            else:
                print(f"  [LOCATION] ⚠️ Camera {camera_id} not found in database!")
            
            payload = {
                'id': str(updated_event.id),
                'type': updated_event.event_class.class_name,
                'location': location_display,
                'timestamp': updated_event.timestamp.isoformat(),
                'snapshot_url': display_snapshot_url,
                'occurrence_count': len(existing_snapshots),
                'status': 'unacknowledged'
            }
            print(f"  [STORED] Updated EventLog ID={updated_event.id}, count={len(existing_snapshots)}")
            print(f"[EVENT_CREATE] END\n")
            
            # Emit update to frontend
            await socketio_server.emit('alert_accumulated', payload)
            
            return {"status": "success", "data": payload, "accumulated": True}, 200
        else:
            # No recent match, create new event
            file_path_json = _serialize_snapshot_data([snapshot_url], snapshot_url)
            
            new_event = await db.eventlog.create(
                data={
                    'cam_id': camera_id,
                    'event_class_id': event_class_id,
                    'timestamp': datetime.now(timezone.utc),
                    'file_path': file_path_json
                },
                include={
                    'camera': {'include': {'location': True}},
                    'event_class': True
                }
            )

            from src.services.socket_manager import socketio_server 
            
            # Determine location - try location first, fall back to camera name, then ID
            location_display = 'Unknown'
            if new_event.camera:
                if new_event.camera.location and new_event.camera.location.loc_name:
                    location_display = new_event.camera.location.loc_name
                    print(f"  [LOCATION] ✓ Using location: {location_display}")
                elif new_event.camera.cam_name:
                    location_display = new_event.camera.cam_name
                    print(f"  [LOCATION] Using camera name: {location_display}")
                else:
                    location_display = f"Camera {new_event.camera.id}"
                    print(f"  [LOCATION] Using camera ID: {location_display}")
            else:
                print(f"  [LOCATION] ⚠️ Camera {camera_id} not found in database!")
            
            payload = {
                'id': str(new_event.id),
                'type': new_event.event_class.class_name,
                'location': location_display,
                'timestamp': new_event.timestamp.isoformat(),
                'snapshot_url': snapshot_url,
                'occurrence_count': 1,
                'status': 'unacknowledged'
            }
            print(f"  [CREATED] New EventLog ID={new_event.id}, event_class_id={new_event.event_class_id}, type='{payload['type']}'")
            print(f"[EVENT_CREATE] END\n")
            
            # Emit alert to frontend
            await socketio_server.emit('new_alert', payload)

            return {"status": "success", "data": payload, "accumulated": False}, 201
    except Exception as e:
        import traceback
        print(f"[EVENT_CREATE] ERROR: {str(e)}")
        print(f"[EVENT_CREATE] Traceback:\n{traceback.format_exc()}")
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}, 500

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
            # Parse accumulated snapshot data
            parsed_data = _parse_snapshot_data(log.file_path)
            
            if parsed_data:
                # Accumulated format
                snapshot_url = parsed_data['first_snapshot']
                occurrence_count = parsed_data['count']
                all_snapshots = parsed_data['snapshots']
            else:
                # Legacy single URL format
                snapshot_url = log.file_path
                occurrence_count = 1
                all_snapshots = [log.file_path] if log.file_path else []
            
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": _location_label(log.camera),
                "timestamp": log.timestamp.isoformat(),
                "snapshot_url": snapshot_url,
                "all_snapshots": all_snapshots,
                "occurrence_count": occurrence_count,
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
            # Parse accumulated snapshot data
            parsed_data = _parse_snapshot_data(log.file_path)
            
            if parsed_data:
                # Accumulated format
                snapshot_url = parsed_data['first_snapshot']
                occurrence_count = parsed_data['count']
                all_snapshots = parsed_data['snapshots']
            else:
                # Legacy single URL format
                snapshot_url = log.file_path
                occurrence_count = 1
                all_snapshots = [log.file_path] if log.file_path else []
            
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": _location_label(log.camera),
                "timestamp": log.timestamp.isoformat(),
                "snapshot_url": snapshot_url,
                "all_snapshots": all_snapshots,
                "occurrence_count": occurrence_count,
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