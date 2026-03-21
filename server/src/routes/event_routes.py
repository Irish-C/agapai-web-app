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
async def create_event(request: Request):
    data = await get_sanitized_json(request)
    result, code = await create_event_logic(data)
    return safe_json_response(status_code=code, content=result)

# server/src/routes/event_routes.py

@router.get('/event_logs') # Ensure this is exactly '/event_logs'
async def get_event_logs(request: Request):
    params = sanitize_input(dict(request.query_params))
    result, code = await get_event_logs_logic(params)
    return safe_json_response(status_code=code, content=result)

@router.post('/events/{log_id}/acknowledge')
async def acknowledge_event(log_id: int, user_id: str = Depends(get_current_user_id)):
    result, code = await mark_viewed_logic(log_id, user_id)
    return safe_json_response(status_code=code, content=result)

@router.post('/events/{log_id}/unacknowledge')
async def unacknowledge_event(log_id: int):
    result, code = await mark_unviewed_logic(log_id)
    return safe_json_response(status_code=code, content=result)

# Add this route to your existing router
@router.get("/event-types")
async def get_event_types():
    return await get_event_types_logic()

@router.get("/logs/export")
async def export_logs(date: str):
    """Export incident logs for a specific date in JSON format
    
    Query param: date (YYYY-MM-DD format)
    Example: /api/logs/export?date=2026-03-20
    """
    result, code = await export_logs_by_date_logic(date)
    return safe_json_response(status_code=code, content=result)


@router.get("/alerts/missed/{timestamp_ms}")
async def get_missed_alerts(timestamp_ms: int):
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

