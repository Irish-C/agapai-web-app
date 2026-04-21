from database import db
from datetime import datetime, timedelta, timezone
from src.utils.role_utils import normalize_role
import json


async def _get_location_label():
    """Get location name from the single camera configuration."""
    try:
        result = await db.query_raw(
            'SELECT loc_name FROM location WHERE id = (SELECT loc_id FROM camera_config WHERE id = 1) LIMIT 1'
        )
        if result:
            loc = result[0] if isinstance(result, list) else result
            return loc.get('loc_name') if isinstance(loc, dict) else str(loc)
    except Exception:
        pass
    return "Unknown"


async def create_event_logic(data):
    try:
        event_class_id = int(data.get('event_class_id', 1))
        class_name = data.get('class_name')
        camera_id = int(data['camera_id'])  # Should always be 1 in single-camera mode
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
        gap_threshold_seconds = 30  # Gap threshold: if >= 30s since last event, treat as NEW
        
        print(f"  [DEDUP] Checking for recent events:")
        print(f"    - Event Class ID: {event_class_id}")
        print(f"    - Time window: {time_window} to now")
        
        recent_event = await db.eventlog.find_first(
            where={
                'event_class_id': event_class_id,
                'timestamp': {'gte': time_window},
                'deleted_at': None  # Exclude soft-deleted events
            },
            order={'timestamp': 'desc'}
        )
        
        # Get the camera's current location_id (immutable for this event)
        camera_config = await db.cameraconfig.find_unique(where={'id': 1})
        location_id = camera_config.loc_id if camera_config else None
        # Use location_name from AI service (always trust it - it's sent with snapshot)
        # To ensure snapshot filename and alert location are always in sync
        location_for_alert = location_name if location_name else "Unknown"
        
        # NEW: Smart gap detection - check if there's a significant gap since last event
        if recent_event:
            time_since_last = datetime.now(timezone.utc) - recent_event.timestamp
            print(f"  [DEDUP] Found recent event (ID={recent_event.id}), time since last: {time_since_last.total_seconds():.1f}s")
            
            if time_since_last.total_seconds() >= gap_threshold_seconds:
                # Gap detected - reset and create NEW event instead of accumulating
                print(f"  [DEDUP] Gap detected ({time_since_last.total_seconds():.1f}s >= {gap_threshold_seconds}s) - treating as NEW event")
                recent_event = None  # Reset to trigger new event creation
            else:
                print(f"  [DEDUP] Within gap window ({time_since_last.total_seconds():.1f}s < {gap_threshold_seconds}s) - accumulating to existing event")
        
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
                    'event_class': True,
                    'snapshots': {'orderBy': {'timestamp': 'asc'}}
                }
            )
            
            snapshot_urls = [f"http://localhost:3000/api/snapshots/{s.filename}" for s in updated_event.snapshots]
            display_snapshot_url = snapshot_urls[0] if snapshot_urls else None
            
            payload = {
                'id': str(updated_event.id),
                'type': updated_event.event_class.class_name if updated_event.event_class else "Unknown",
                'location': location_for_alert,
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
            # Create new event with location_id immutably stored
            new_event = await db.eventlog.create(
                data={
                    'event_class_id': event_class_id,
                    'location_id': location_id,  # Store location at event creation time
                    'timestamp': datetime.now(timezone.utc)
                },
                include={
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
            
            payload = {
                'id': str(new_event.id),
                'type': new_event.event_class.class_name if new_event.event_class else "Unknown",
                'location': location_for_alert,
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
        
        # Build SQL WHERE clause
        where_parts = ["el.deleted_at IS NULL"]
        
        if filters:
            start_date = filters.get('start_date')
            end_date = filters.get('end_date')
            tz_offset_minutes = int(filters.get('tz_offset_minutes', 0) or 0)

            if start_date or end_date:
                if start_date:
                    local_start = datetime.strptime(start_date, '%Y-%m-%d').replace(
                        hour=0, minute=0, second=0, microsecond=0,
                    )
                    start_dt = local_start + timedelta(minutes=tz_offset_minutes)
                    where_parts.append(f"el.timestamp >= '{start_dt.isoformat()}'")

                if end_date:
                    local_end = datetime.strptime(end_date, '%Y-%m-%d').replace(
                        hour=0, minute=0, second=0, microsecond=0,
                    ) + timedelta(days=1)
                    end_dt = local_end + timedelta(minutes=tz_offset_minutes)
                    where_parts.append(f"el.timestamp < '{end_dt.isoformat()}'")

                # Validate date range
                if start_date and end_date:
                    start_dt = datetime.strptime(start_date, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0)
                    end_dt = datetime.strptime(end_date, '%Y-%m-%d').replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
                    if start_dt >= end_dt:
                        return {"status": "error", "message": "start_date must be on or before end_date"}, 400
        
        where_clause = " AND ".join(where_parts)
        
        # Use raw SQL to fetch event logs with their stored locations
        logs_result = await db.query_raw(
            f"""
            SELECT DISTINCT el.id, el.timestamp, el.event_status, el.ack_by_user_id, el.event_class_id, el.file_path, el.location_id, l.loc_name
            FROM event_logs el
            LEFT JOIN location l ON el.location_id = l.id
            WHERE {where_clause}
            ORDER BY el.timestamp DESC
            LIMIT {limit}
            """
        )
        
        logs = logs_result if logs_result else []
        
        # Format each log with its related data
        formatted_data = []
        for log in logs:
            log_dict = dict(log) if hasattr(log, 'keys') else log
            log_id = log_dict.get('id')
            
            # Get event class name
            class_name = "Unknown"
            if log_dict.get('event_class_id'):
                ec_result = await db.query_raw(
                    f"SELECT class_name FROM event_class WHERE id = {log_dict['event_class_id']} LIMIT 1"
                )
                if ec_result:
                    ec_dict = dict(ec_result[0]) if hasattr(ec_result[0], 'keys') else ec_result[0]
                    class_name = ec_dict.get('class_name', 'Unknown')
            
            # Get acknowledged by username
            ack_username = None
            if log_dict.get('ack_by_user_id'):
                user_result = await db.query_raw(
                    f"SELECT username FROM users WHERE id = {log_dict['ack_by_user_id']} LIMIT 1"
                )
                if user_result:
                    user_dict = dict(user_result[0]) if hasattr(user_result[0], 'keys') else user_result[0]
                    ack_username = user_dict.get('username')
            
            # Get snapshots for this event log
            snapshot_urls = []
            snapshots_result = await db.query_raw(
                f"SELECT filename FROM snapshots WHERE event_log_id = {log_id} ORDER BY timestamp ASC"
            )
            if snapshots_result:
                for snap in snapshots_result:
                    snap_dict = dict(snap) if hasattr(snap, 'keys') else snap
                    filename = snap_dict.get('filename') if isinstance(snap_dict, dict) else None
                    if filename:
                        snapshot_urls.append(f"http://localhost:3000/api/snapshots/{filename}")
            
            # Timestamp from raw SQL is already an isoformat string
            timestamp_val = log_dict.get('timestamp')
            if hasattr(timestamp_val, 'isoformat'):
                timestamp_str = timestamp_val.isoformat()
            else:
                timestamp_str = str(timestamp_val) if timestamp_val else ''
            
            formatted_data.append({
                "id": str(log_id),
                "type": class_name,
                "location": log_dict.get('loc_name') or 'Unknown',  # Use stored location from event recording time
                "timestamp": timestamp_str,
                "snapshot_url": snapshot_urls[0] if snapshot_urls else None,
                "all_snapshots": snapshot_urls,
                "occurrence_count": len(snapshot_urls),
                "status": log_dict.get('event_status', 'unacknowledged'),
                "acknowledged_by_username": ack_username
            })
        
        return {"status": "success", "report": formatted_data}, 200
    except ValueError:
        return {"status": "error", "message": "Invalid date format. Use YYYY-MM-DD"}, 400
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()
        return {"status": "error", "message": str(e)}, 500

async def get_viewed_event_logs_logic(filters=None):
    try:
        limit = int(filters.get('limit', 50)) if filters else 50
        
        logs = await db.eventlog.find_many(
            take=limit,
            where={'deleted_at': None},  # Exclude soft-deleted events
            order={'timestamp': 'desc'},
            include={
                'event_class': True,
                'snapshots': {'orderBy': {'timestamp': 'asc'}}
            }
        )
        
        unacknowledged = [log for log in logs if log.event_status == 'unacknowledged']
        acknowledged = [log for log in logs if log.event_status == 'acknowledged']
        unacknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        acknowledged.sort(key=lambda log: log.timestamp, reverse=True)
        sorted_logs = unacknowledged + acknowledged
        
        location_label = await _get_location_label()
        
        formatted_data = []
        for log in sorted_logs:
            snapshot_urls = [f"http://localhost:3000/api/snapshots/{s.filename}" for s in log.snapshots]
            
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": location_label,
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
                'event_class': True,
                'snapshots': {'orderBy': {'timestamp': 'asc'}}
            }
        )
        
        print(f"[export_logs] Found {len(logs)} events for {date_str}")
        
        location_label = await _get_location_label()
        
        # Format the data
        formatted_data = []
        for log in logs:
            snapshot_urls = [f"http://localhost:3000/api/snapshots/{s.filename}" for s in log.snapshots]
            
            formatted_data.append({
                "id": str(log.id),
                "type": log.event_class.class_name if log.event_class else "Unknown",
                "location": location_label,
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
        
        # Use raw SQL since Prisma client doesn't properly reflect schema changes
        result = await db.query_raw(
            f"""
            SELECT el.id, el.timestamp, el.event_status, el.file_path, ec.class_name
            FROM event_logs el
            LEFT JOIN event_class ec ON el.event_class_id = ec.id
            WHERE el.timestamp > '{since_datetime.isoformat()}'
            AND el.deleted_at IS NULL
            ORDER BY el.timestamp DESC
            """
        )
        
        alerts = result if result else []
        print(f"[get_missed_alerts] Found {len(alerts)} missed alerts")
        
        location_label = await _get_location_label()
        
        # Format the data to match Socket.IO 'new_alert' payload
        formatted_alerts = []
        for alert in alerts:
            alert_dict = dict(alert) if hasattr(alert, 'keys') else alert
            formatted_alerts.append({
                'id': str(alert_dict.get('id')),
                'type': alert_dict.get('class_name') or 'unknown',
                'location': location_label,
                'timestamp': alert_dict.get('timestamp').isoformat() if alert_dict.get('timestamp') else '',
                'snapshot_url': alert_dict.get('file_path'),
                'status': alert_dict.get('event_status') or 'unacknowledged'
            })
        
        return {
            'status': 'success',
            'count': len(formatted_alerts),
            'alerts': formatted_alerts
        }, 200
        
    except Exception as e:
        print(f"Error fetching missed alerts: {e}")
        import traceback
        traceback.print_exc()
        return {'status': 'error', 'message': str(e)}, 500