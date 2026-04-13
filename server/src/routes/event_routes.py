from fastapi import APIRouter, Request, Depends
from src.controllers.event_controller import get_event_types_logic
from src.utils.input_sanitization import get_sanitized_json, sanitize_input
from src.utils.serialization import safe_json_response

from src.utils.auth import get_current_user_id
from src.controllers.event_controller import (
    get_event_logs_logic,
    mark_viewed_logic,
    mark_unviewed_logic,
    create_event_logic,
    export_logs_by_date_logic,
    get_missed_alerts_logic,
)

router = APIRouter()

@router.post('/events')
async def create_event(request: Request, user_id: str = Depends(get_current_user_id)):
    data = await get_sanitized_json(request)
    result, code = await create_event_logic(data)
    return safe_json_response(status_code=code, content=result)

@router.post('/alerts')
async def create_alert_from_flask(request: Request):
    """Receive alerts from Flask AI service and broadcast via Socket.IO"""
    try:
        data = await get_sanitized_json(request)
        # Flask sends: camera_id, alert_message, event_class_id, class_name, snapshot_url, timestamp
        # Convert to event_logic format
        event_data = {
            'camera_id': data.get('camera_id'),
            'event_class_id': data.get('event_class_id', 1),
            'class_name': data.get('class_name'),  # ADD THIS - critical for classification lookup!
            'message': data.get('alert_message', ''),
            'snapshot_url': data.get('snapshot_url', ''),
            'timestamp': data.get('timestamp')
        }
        result, code = await create_event_logic(event_data)
        return safe_json_response(status_code=code, content=result)
    except Exception as e:
        print(f"[ALERT ROUTE ERROR] {e}")
        return safe_json_response(status_code=500, content={'error': str(e)})

# server/src/routes/event_routes.py

@router.get('/event_logs') # Ensure this is exactly '/event_logs'
async def get_event_logs(request: Request, user_id: str = Depends(get_current_user_id)):
    params = sanitize_input(dict(request.query_params))
    result, code = await get_event_logs_logic(params)
    return safe_json_response(status_code=code, content=result)

@router.post('/events/{log_id}/acknowledge')
async def acknowledge_event(log_id: int, user_id: str = Depends(get_current_user_id)):
    result, code = await mark_viewed_logic(log_id, user_id)
    return safe_json_response(status_code=code, content=result)

@router.post('/events/{log_id}/unacknowledge')
async def unacknowledge_event(log_id: int, user_id: str = Depends(get_current_user_id)):
    result, code = await mark_unviewed_logic(log_id, user_id)
    return safe_json_response(status_code=code, content=result)

# Add this route to your existing router
@router.get("/event-types")
async def get_event_types(user_id: str = Depends(get_current_user_id)):
    return await get_event_types_logic()

@router.get("/logs/export")
async def export_logs(date: str, user_id: str = Depends(get_current_user_id)):
    """Export incident logs for a specific date in JSON format
    
    Query param: date (YYYY-MM-DD format)
    Example: /api/logs/export?date=2026-03-20
    """
    result, code = await export_logs_by_date_logic(date)
    return safe_json_response(status_code=code, content=result)


@router.get("/alerts/missed/{timestamp_ms}")
async def get_missed_alerts(timestamp_ms: int, user_id: str = Depends(get_current_user_id)):
    """Fetch alerts (YOLO detections) that occurred after a specific timestamp.
    
    Used by frontend after Socket.IO reconnect to sync missed detections.
    
    Query param: timestamp_ms (Unix timestamp in milliseconds)
    Example: /api/alerts/missed/1710950000000
    
    Returns missed alerts in same format as Socket.IO 'new_alert' event:
    {
        "status": "success",
        "count": int,
        "alerts": [
            {
                "id": str,
                "type": str,
                "location": str,
                "timestamp": ISO string,
                "snapshot_url": str,
                "status": str
            }
        ]
    }
    """
    result, code = await get_missed_alerts_logic(timestamp_ms)
    return safe_json_response(status_code=code, content=result)


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int, user_id: str = Depends(get_current_user_id)):
    """
    REST endpoint for acknowledging alerts (backup to Socket.IO).
    
    Usage: POST /api/alerts/12345/acknowledge
    
    Updates alert status and stops hardware alarm.
    """
    try:
        from database import db
        from src.services.hardware import hardware_alert
        from datetime import datetime, timezone
        
        # Update database
        updated_log = await db.eventlog.update(
            where={"id": alert_id},
            data={
                "event_status": "acknowledged",
                "ack_by_user_id": int(user_id)
            }
        )
        
        print(f"[Event Routes] Alert {alert_id} acknowledged by user {user_id}")
        
        # Try to stop hardware alarm
        try:
            hardware_alert.stop_alarm()
            print(f"[Event Routes] Hardware alarm stopped")
        except Exception as e:
            print(f"[Event Routes] ⚠️ Could not stop hardware alarm: {e}")
        
        return safe_json_response(
            status_code=200,
            content={
                "status": "success",
                "message": "Alert acknowledged",
                "alert": {
                    "id": updated_log.id,
                    "status": updated_log.event_status
                }
            }
        )
        
    except Exception as e:
        print(f"[Event Routes] Error acknowledging alert: {e}")
        return safe_json_response(
            status_code=400,
            content={"status": "error", "message": str(e)}
        )


