import asyncio
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from src.utils.input_sanitization import get_sanitized_json, sanitize_input
from src.utils.serialization import safe_json_response
from src.utils.redis_pool import RedisConnectionPool

from src.controllers.camera_controller import (
    get_cameras_logic,
    create_camera_logic,
    get_camera_logic,
    update_camera_logic,
    delete_camera_logic,
    publish_camera_to_mediamtx,
    unpublish_camera_from_mediamtx,
)
from src.utils.auth import get_current_user_id, require_admin_user_id

router = APIRouter()

@router.get('/cameras')
async def get_all_cameras(user_id: str = Depends(get_current_user_id)):
    data, code = await get_cameras_logic()
    return safe_json_response(status_code=code, content={'status': 'success', 'cameras': data})

@router.get('/cameras/{camera_id}')
async def get_single_camera(camera_id: int, user_id: str = Depends(get_current_user_id)):
    result, code = await get_camera_logic(camera_id)
    return safe_json_response(status_code=code, content=result)

# NEW: Logic for manually adding a camera via the Management UI
@router.post('/cameras')
async def create_camera(camera_data: dict, user_id: str = Depends(require_admin_user_id)):
    camera_data = sanitize_input(camera_data)
    # 1. Save the camera details (Name, RTSP Link, Location) to the database
    result, code = await create_camera_logic(camera_data)
    
    # 2. If the database save was successful (201 Created)
    # Streaming/background capture has been removed; do not start stream tasks here.
    if code == 201:
        pass
        
    return safe_json_response(status_code=code, content=result)

# PATCH endpoint for updating camera details
@router.patch('/cameras/{camera_id}')
async def update_camera(camera_id: int, request: Request, user_id: str = Depends(require_admin_user_id)):
    camera_data = await get_sanitized_json(request)
    result, code = await update_camera_logic(camera_id, camera_data)
    return safe_json_response(status_code=code, content=result)

@router.delete('/cameras/{camera_id}')
async def delete_camera(camera_id: int, user_id: str = Depends(require_admin_user_id)):
    result, code = await delete_camera_logic(camera_id)
    return safe_json_response(status_code=code, content=result)


@router.post('/cameras/{camera_id}/publish')
async def publish_camera_disabled(camera_id: int, user_id: str = Depends(require_admin_user_id)):
    # Start publish -> spawn relay or processing worker
    try:
        result, code = await publish_camera_to_mediamtx(camera_id)
        return safe_json_response(status_code=code, content=result)
    except Exception as e:
        return safe_json_response(status_code=500, content={'error': str(e)})


@router.post('/cameras/{camera_id}/unpublish')
async def unpublish_camera_disabled(camera_id: int, user_id: str = Depends(require_admin_user_id)):
    try:
        result, code = await unpublish_camera_from_mediamtx(camera_id)
        return safe_json_response(status_code=code, content=result)
    except Exception as e:
        return safe_json_response(status_code=500, content={'error': str(e)})


@router.post('/set_active_camera')
async def set_active_camera(request: Request):
    data = await get_sanitized_json(request)
    camera_id = data.get('camera_id')
    r = RedisConnectionPool.get()
    r.set('active_camera_id', camera_id)
    return {'status': 'success', 'active_camera_id': camera_id}


@router.post('/sync_published_cameras')
async def sync_published_cameras(request: Request):
    """Sync published cameras from frontend to backend Redis."""
    try:
        data = await get_sanitized_json(request)
        camera_ids = data.get('cameras', [])
        
        # Convert to strings and store in Redis set
        camera_ids_str = [str(cid) for cid in camera_ids]
        r = RedisConnectionPool.get()
        
        # Clear old set and add new one
        r.delete('published_cameras')
        if camera_ids_str:
            r.sadd('published_cameras', *camera_ids_str)
        
        print(f"[sync_published_cameras] Updated published cameras: {camera_ids_str}")
        return {'status': 'success', 'cameras': camera_ids_str}
    except Exception as e:
        print(f"[sync_published_cameras] Error: {e}")
        return JSONResponse(status_code=500, content={'error': str(e)})