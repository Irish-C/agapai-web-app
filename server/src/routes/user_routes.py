from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from database import db
from src.utils.auth import get_current_user_id

from src.controllers.user_controller import (
    login_logic,
    get_profile_logic,
    list_users_logic,
    create_user_logic,
    update_user_logic,
    archive_user_logic,
    change_password_logic,
)
from src.utils.auth import create_token, get_current_user_id

router = APIRouter()

@router.post('/login')
async def login(request: Request):
    data = await request.json()
    response, status_code = await login_logic(data)

    # Attach JWT token on successful login
    if status_code == 200 and response.get('user_id'):
        response['token'] = create_token(str(response['user_id']))

    return JSONResponse(status_code=status_code, content=response)

@router.get('/user/profile')
async def get_user_profile(user_id: str = Depends(get_current_user_id)):
    result, code = await get_profile_logic(user_id)
    return JSONResponse(status_code=code, content=result)

@router.get('/users')
async def list_users(user_id: str = Depends(get_current_user_id)):
    # Auth enforced via dependency.
    result, code = await list_users_logic()
    return JSONResponse(status_code=code, content=result)

@router.post('/users')
async def create_user(request: Request, user_id: str = Depends(get_current_user_id)):
    data = await request.json()
    result, code = await create_user_logic(data)
    return JSONResponse(status_code=code, content=result)

@router.patch('/users/{user_id}')
async def update_user(user_id: int, request: Request, current_user_id: str = Depends(get_current_user_id)):
    data = await request.json()
    result, code = await update_user_logic(user_id, data)
    return JSONResponse(status_code=code, content=result)

@router.patch('/users/{user_id}/archive')
async def archive_user(user_id: int, current_user_id: str = Depends(get_current_user_id)):
    result, code = await archive_user_logic(user_id)
    return JSONResponse(status_code=code, content=result)

@router.post('/users/change-password')
async def change_password(request: Request, user_id: str = Depends(get_current_user_id)):
    data = await request.json()
    old_password = data.get('old_password')
    new_password = data.get('new_password')
    result, code = await change_password_logic(user_id, old_password, new_password)
    return JSONResponse(status_code=code, content=result)

@router.get('/roles')
async def get_roles():
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