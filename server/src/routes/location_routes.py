from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse

from src.controllers.location_controller import (
    list_locations_logic,
    create_location_logic,
    update_location_logic,
    delete_location_logic,
)
from src.utils.auth import get_current_user_id

router = APIRouter()

@router.get('/locations')
async def list_locations(user_id: str = Depends(get_current_user_id)):
    result, code = await list_locations_logic()
    return JSONResponse(status_code=code, content=result)

@router.post('/locations')
async def create_location(request: Request, user_id: str = Depends(get_current_user_id)):
    data = await request.json()
    result, code = await create_location_logic(data)
    return JSONResponse(status_code=code, content=result)

@router.patch('/locations/{location_id}')
async def update_location(location_id: int, request: Request, user_id: str = Depends(get_current_user_id)):
    data = await request.json()
    result, code = await update_location_logic(location_id, data)
    return JSONResponse(status_code=code, content=result)

@router.delete('/locations/{location_id}')
async def delete_location(location_id: int, user_id: str = Depends(get_current_user_id)):
    result, code = await delete_location_logic(location_id)
    return JSONResponse(status_code=code, content=result)
