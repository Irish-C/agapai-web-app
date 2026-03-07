from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from src.controllers.event_controller import get_event_types_logic

from src.utils.auth import get_current_user_id
from src.controllers.event_controller import (
    get_event_logs_logic,
    mark_viewed_logic,
    create_event_logic,
)

router = APIRouter()

@router.post('/events')
async def create_event(request: Request):
    data = await request.json()
    result, code = await create_event_logic(data)
    return JSONResponse(status_code=code, content=result)

# server/src/routes/event_routes.py

@router.get('/event_logs') # Ensure this is exactly '/event_logs'
async def get_event_logs(request: Request):
    params = dict(request.query_params)
    result, code = await get_event_logs_logic(params)
    return JSONResponse(status_code=code, content=result)

@router.post('/events/{log_id}/acknowledge')
async def acknowledge_event(log_id: int, user_id: str = Depends(get_current_user_id)):
    result, code = await mark_viewed_logic(log_id, user_id)
    return JSONResponse(status_code=code, content=result)

# Add this route to your existing router
@router.get("/event-types")
async def get_event_types():
    return await get_event_types_logic()


