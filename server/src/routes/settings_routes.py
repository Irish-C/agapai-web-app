from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from src.utils.input_sanitization import get_sanitized_json
from src.utils.serialization import safe_json_response

from src.utils.auth import get_current_user_id, require_admin_user_id
from scripts.seed_db import seed_database
from src.controllers.camera_controller import (
    get_camera_config_logic,
    start_camera_detection_logic,
    stop_camera_detection_logic,
    update_camera_config_logic
)

router = APIRouter()


@router.get('/settings/camera')
async def get_camera_settings(user_id: str = Depends(get_current_user_id)):
    """Get current camera configuration (view-only)."""
    result, code = await get_camera_config_logic()
    return safe_json_response(status_code=code, content=result)


@router.put('/settings/camera')
async def update_camera_settings(request: Request, user_id: str = Depends(require_admin_user_id)):
    """Update camera configuration and auto-restart AI service (admin-only)."""
    data = await get_sanitized_json(request)
    
    # Step 1: Update camera config
    config_result, config_code = await update_camera_config_logic(data)
    
    if config_code != 200:
        # Config update failed, return error without trying to restart
        return safe_json_response(status_code=config_code, content=config_result)
    
    # Step 2: Auto-restart AI service with new RTSP URL
    ai_result, ai_code = await start_camera_detection_logic()
    
    # Step 3: Return combined response with both config update and AI restart status
    combined_response = {
        **config_result,
        "ai_service_status": ai_result.get("status") if isinstance(ai_result, dict) else "unknown",
        "ai_service_message": ai_result.get("message") if isinstance(ai_result, dict) else str(ai_result),
    }
    
    # Return 200 if config update succeeded, even if AI restart has warnings
    return safe_json_response(status_code=200, content=combined_response)


@router.post('/settings/camera/start')
async def start_camera(user_id: str = Depends(get_current_user_id)):
    """Start AI detection for the camera."""
    result, code = await start_camera_detection_logic()
    return safe_json_response(status_code=code, content=result)


@router.post('/settings/camera/stop')
async def stop_camera(user_id: str = Depends(get_current_user_id)):
    """Stop AI detection for the camera."""
    result, code = await stop_camera_detection_logic()
    return safe_json_response(status_code=code, content=result)


@router.post('/seed_db')
async def seed_db_route():
    try:
        await seed_database()
        return {'status': 'success', 'message': 'Database seeded'}
    except Exception as e:
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(e)})

