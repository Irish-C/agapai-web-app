from fastapi import APIRouter, Request, Depends
from src.utils.input_sanitization import get_sanitized_json
from src.utils.serialization import safe_json_response

from src.controllers.settings_controller import save_notifications_logic
from src.utils.auth import get_current_user_id, require_admin_user_id
from src.controllers.settings_controller import get_global_notifications_logic, save_global_notifications_logic

router = APIRouter()

@router.post('/settings/notifications')
async def save_notification_settings(request: Request, user_id: str = Depends(get_current_user_id)):
    data = await get_sanitized_json(request)
    result, code = await save_notifications_logic(user_id, data)
    return safe_json_response(status_code=code, content=result)


@router.get('/settings/notifications/global')
async def get_global_notification_settings(user_id: str = Depends(require_admin_user_id)):
    result, code = await get_global_notifications_logic()
    return safe_json_response(status_code=code, content=result)


@router.post('/settings/notifications/global')
async def post_global_notification_settings(request: Request, user_id: str = Depends(require_admin_user_id)):
    data = await get_sanitized_json(request)
    result, code = await save_global_notifications_logic(data)
    return safe_json_response(status_code=code, content=result)
