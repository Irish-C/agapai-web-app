from fastapi import APIRouter, Request, Depends
from database import db
from src.utils.auth import get_current_user_id, require_admin_user_id
from src.utils.input_sanitization import get_sanitized_json
from src.utils.serialization import safe_json_response

from src.controllers.user_controller import (
    login_logic,
    get_profile_logic,
    list_users_logic,
    create_user_logic,
    update_user_logic,
    archive_user_logic,
    change_password_logic,
)
from src.utils.auth import create_token
from src.utils.rate_limiter import (
    enforce_ip_rate_limit,
    check_login_lockout,
    record_login_failure,
    clear_login_failures,
    LOGIN_RATE_LIMIT,
    LOGIN_RATE_WINDOW_SECONDS,
)

router = APIRouter()

@router.post('/login')
async def login(request: Request):
    data = await get_sanitized_json(request)

    allowed, retry_after = await enforce_ip_rate_limit(
        request=request,
        namespace='api_login',
        limit=LOGIN_RATE_LIMIT,
        window_seconds=LOGIN_RATE_WINDOW_SECONDS,
    )
    if not allowed:
        return safe_json_response(
            status_code=429,
            content={
                'status': 'error',
                'message': 'Too many login attempts. Please try again shortly.',
                'retry_after_seconds': retry_after,
            },
            headers={'Retry-After': str(retry_after)},
        )

    username = data.get('username')
    is_locked, lock_ttl = await check_login_lockout(request, username)
    if is_locked:
        return safe_json_response(
            status_code=429,
            content={
                'status': 'error',
                'message': 'Account temporarily locked due to repeated failed logins.',
                'retry_after_seconds': lock_ttl,
            },
            headers={'Retry-After': str(lock_ttl)},
        )

    response, status_code = await login_logic(data)

    # Attach JWT token on successful login
    if status_code == 200 and response.get('user_id'):
        response['token'] = create_token(str(response['user_id']))
        await clear_login_failures(request, username)
    elif status_code == 401:
        await record_login_failure(request, username)

    return safe_json_response(status_code=status_code, content=response)

@router.get('/user/profile')
async def get_user_profile(user_id: str = Depends(get_current_user_id)):
    result, code = await get_profile_logic(user_id)
    return safe_json_response(status_code=code, content=result)

@router.get('/users')
async def list_users(user_id: str = Depends(require_admin_user_id)):
    result, code = await list_users_logic()
    return safe_json_response(status_code=code, content=result)

@router.post('/users')
async def create_user(request: Request, user_id: str = Depends(require_admin_user_id)):
    data = await get_sanitized_json(request)
    result, code = await create_user_logic(data)
    return safe_json_response(status_code=code, content=result)

@router.patch('/users/{user_id}')
async def update_user(user_id: int, request: Request, current_user_id: str = Depends(require_admin_user_id)):
    data = await get_sanitized_json(request)
    result, code = await update_user_logic(user_id, data)
    return safe_json_response(status_code=code, content=result)

@router.patch('/users/{user_id}/archive')
async def archive_user(user_id: int, current_user_id: str = Depends(require_admin_user_id)):
    result, code = await archive_user_logic(user_id)
    return safe_json_response(status_code=code, content=result)

@router.post('/users/change-password')
async def change_password(request: Request, user_id: str = Depends(get_current_user_id)):
    data = await get_sanitized_json(request)
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    result, code = await change_password_logic(user_id, old_password, new_password)
    return safe_json_response(status_code=code, content=result)

@router.get('/roles')
async def get_roles(user_id: str = Depends(require_admin_user_id)):
    try:
        # Now 'db' is defined and can be used
        roles = await db.role.find_many()
        role_names = [r.role_name for r in roles]
        
        return {
            "status": "success",
            "data": role_names
        }
    except Exception as e:
        print(f"Database Error: {e}")
        return {
            "status": "error",
            "message": f"Failed to fetch roles: {str(e)}"
        }, 500
    try:
        # Fetch all roles from the Role table
        roles = await db.role.find_many()
        
        # Extract just the names into a list
        role_names = [r.role_name for r in roles]
        
        return {
            "status": "success",
            "data": role_names
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to fetch roles: {str(e)}"
        }, 500