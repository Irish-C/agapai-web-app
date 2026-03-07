from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse

from src.controllers.settings_controller import save_notifications_logic
from src.utils.auth import get_current_user_id

router = APIRouter()

@router.post('/settings/notifications')
async def save_notification_settings(request: Request, user_id: str = Depends(get_current_user_id)):
    data = await request.json()
    result, code = await save_notifications_logic(user_id, data)
    return JSONResponse(status_code=code, content=result)
