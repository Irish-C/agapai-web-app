import asyncio
from fastapi import APIRouter, Depends, Request
from src.utils.input_sanitization import get_sanitized_json, sanitize_input
from src.utils.serialization import safe_json_response

from src.controllers.camera_controller import (
    get_cameras_logic,
    create_camera_logic,
    get_camera_logic,
    stream_camera_loop,
    update_camera_logic,
    delete_camera_logic
)
from src.controllers.camera_controller import publish_camera_to_mediamtx, unpublish_camera_from_mediamtx
from src.utils.auth import get_current_user_id
from src.utils.feature_auth import require_feature

router = APIRouter()

@router.get('/cameras')
async def get_all_cameras(
    user_id: str = Depends(get_current_user_id),
    _: None = Depends(require_feature("view_cameras"))
):
    data, code = await get_cameras_logic()
    return safe_json_response(status_code=code, content={'status': 'success', 'cameras': data})

@router.get('/cameras/{camera_id}')
async def get_single_camera(
    camera_id: int,
    user_id: str = Depends(get_current_user_id),
    _: None = Depends(require_feature("view_cameras"))
):
    result, code = await get_camera_logic(camera_id)
    return safe_json_response(status_code=code, content=result)

# NEW: Logic for manually adding a camera via the Management UI
@router.post('/cameras')
async def create_camera(
    camera_data: dict,
    user_id: str = Depends(get_current_user_id),
    _: None = Depends(require_feature("add_camera"))
):
    camera_data = sanitize_input(camera_data)
    # 1. Save the camera details (Name, RTSP Link, Location) to the database
    result, code = await create_camera_logic(camera_data)
    
    # 2. If the database save was successful (201 Created)
    if code == 201:
        # Start the OpenCV background stream immediately for this new camera
        # Note: result['camera_id'] comes from your controller as a string
        cam_id = int(result['camera_id'])
        rtsp_url = camera_data.get('stream_url')
        
        print(f"Manual Add: Starting background stream for Camera {cam_id}")
        asyncio.create_task(stream_camera_loop(cam_id, rtsp_url))
        
    return safe_json_response(status_code=code, content=result)

@router.patch('/cameras/{camera_id}')
async def update_camera(
    camera_id: int,
    request: Request,
    user_id: str = Depends(get_current_user_id),
    _: None = Depends(require_feature("edit_camera"))
):
    camera_data = await get_sanitized_json(request)
    result, code = await update_camera_logic(camera_id, camera_data)
    return safe_json_response(status_code=code, content=result)

@router.delete('/cameras/{camera_id}')
async def delete_camera(
    camera_id: int,
    user_id: str = Depends(get_current_user_id),
    _: None = Depends(require_feature("delete_camera"))
):
    result, code = await delete_camera_logic(camera_id)
    return safe_json_response(status_code=code, content=result)


@router.post('/cameras/{camera_id}/publish')
async def publish_camera(
    camera_id: int,
    user_id: str = Depends(get_current_user_id),
    _: None = Depends(require_feature("edit_camera"))
):
    """Create/update MediaMTX path for camera and restart MediaMTX."""
    result, code = await publish_camera_to_mediamtx(camera_id)
    return safe_json_response(status_code=code, content=result)


@router.post('/cameras/{camera_id}/unpublish')
async def unpublish_camera(
    camera_id: int,
    user_id: str = Depends(get_current_user_id),
    _: None = Depends(require_feature("edit_camera"))
):
    """Remove camera path from MediaMTX and restart MediaMTX."""
    result, code = await unpublish_camera_from_mediamtx(camera_id)
    return safe_json_response(status_code=code, content=result)