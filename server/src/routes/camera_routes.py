from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from src.controllers.camera_controller import (
    get_cameras_logic,
    create_camera_logic,
    get_camera_logic,
)
from src.utils.auth import get_current_user_id

router = APIRouter()

@router.get('/cameras')
async def get_all_cameras(user_id: str = Depends(get_current_user_id)):
    data, code = await get_cameras_logic()
    return JSONResponse(status_code=code, content={'status': 'success', 'cameras': data})

@router.get('/cameras/{camera_id}')
async def get_single_camera(camera_id: int, user_id: str = Depends(get_current_user_id)):
    result, code = await get_camera_logic(camera_id)
    return JSONResponse(status_code=code, content=result)
