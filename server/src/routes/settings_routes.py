from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from src.utils.input_sanitization import get_sanitized_json
from src.utils.serialization import safe_json_response

from src.utils.auth import get_current_user_id, require_admin_user_id
from seed_db import seed_database

router = APIRouter()




@router.post('/seed_db')
async def seed_db_route():
    try:
        await seed_database()
        return {'status': 'success', 'message': 'Database seeded'}
    except Exception as e:
        return JSONResponse(status_code=500, content={'status': 'error', 'message': str(e)})
