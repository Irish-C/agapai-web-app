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
    get_archived_cameras_logic,
    restore_camera_logic,
    permanently_delete_camera_logic,
)
from src.utils.auth import get_current_user_id, require_admin_user_id

router = APIRouter()

@router.get('/cameras')
async def get_all_cameras(user_id: str = Depends(get_current_user_id)):
    data, code = await get_cameras_logic()
    return safe_json_response(status_code=code, content={'status': 'success', 'cameras': data})

@router.get('/cameras/archived')
async def get_archived_cameras(user_id: str = Depends(require_admin_user_id)):
    """Get list of archived (deleted) cameras for restoration."""
    data, code = await get_archived_cameras_logic()
    return safe_json_response(status_code=code, content={'status': 'success', 'archived_cameras': data})

@router.get('/cameras/{camera_id}')
async def get_single_camera(camera_id: int, user_id: str = Depends(get_current_user_id)):
    result, code = await get_camera_logic(camera_id)
    return safe_json_response(status_code=code, content=result)

# Logic for manually adding a camera via the Management UI
@router.post('/cameras')
async def create_camera(request: Request, user_id: str = Depends(require_admin_user_id)):
    camera_data = await get_sanitized_json(request)
    # 1. Save the camera details (Name, RTSP Link, Location) to the database
    result, code = await create_camera_logic(camera_data)
    
    # 2. If the database save was successful (201 Created), auto-spawn processing worker
    if code == 201:
        try:
            camera_id = result.get('camera_id')
            if camera_id:
                publish_result, publish_code = await publish_camera_to_mediamtx(int(camera_id))
                print(f"[camera_routes] Auto-spawned worker for new camera {camera_id}: {publish_result.get('status', 'started') if isinstance(publish_result, dict) else 'started'}")
        except Exception as e:
            print(f"[camera_routes] Warning: Failed to auto-spawn worker for new camera: {e}")
        
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
async def publish_camera_disabled(camera_id: int, user_id: str = Depends(get_current_user_id)):
    # Start publish -> spawn relay or processing worker
    try:
        result, code = await publish_camera_to_mediamtx(camera_id)
        return safe_json_response(status_code=code, content=result)
    except Exception as e:
        return safe_json_response(status_code=500, content={'error': str(e)})


@router.post('/cameras/{camera_id}/unpublish')
async def unpublish_camera_disabled(camera_id: int, user_id: str = Depends(get_current_user_id)):
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


@router.post('/cameras/{camera_id}/restore')
async def restore_camera(camera_id: int, user_id: str = Depends(require_admin_user_id)):
    """Restore an archived camera back to active status."""
    try:
        result, code = await restore_camera_logic(camera_id)
        # Auto-start the worker after restoration
        if code == 200:
            try:
                publish_result, publish_code = await publish_camera_to_mediamtx(camera_id)
                print(f"[restore_camera] Auto-spawned worker for restored camera {camera_id}")
            except Exception as e:
                print(f"[restore_camera] Warning: Failed to auto-spawn worker: {e}")
        return safe_json_response(status_code=code, content=result)
    except Exception as e:
        return safe_json_response(status_code=500, content={'error': str(e)})


@router.delete('/cameras/{camera_id}/permanent')
async def permanently_delete_camera(camera_id: int, user_id: str = Depends(require_admin_user_id)):
    """Permanently delete an archived camera from the database (hard delete)."""
    try:
        result, code = await permanently_delete_camera_logic(camera_id)
        return safe_json_response(status_code=code, content=result)
    except Exception as e:
        return safe_json_response(status_code=500, content={'error': str(e)})


@router.get('/cameras/config/locations')
async def get_camera_locations():
    """Get camera IDs and their locations (public endpoint for AI service).
    
    Used by Port 3000 AI service to retrieve camera location mappings
    for snapshot filename generation.
    
    Returns: {<camera_id>: <location_name>, ...}
    Example: {"1": "Living Room", "2": "Bedroom A"}
    """
    try:
        from database import db
        
        cameras = await db.camera.find_many(
            where={'cam_status': True},
            include={'location': True}
        )
        
        locations_map = {}
        for cam in cameras:
            loc_name = 'Unknown'
            if cam.location and cam.location.loc_name:
                loc_name = cam.location.loc_name
            locations_map[str(cam.id)] = loc_name
        
        return safe_json_response(
            status_code=200,
            content={'status': 'success', 'cameras': locations_map}
        )
    except Exception as e:
        print(f"[ERROR] Failed to fetch camera locations: {e}")
        return safe_json_response(
            status_code=500,
            content={'status': 'error', 'message': str(e)}
        )