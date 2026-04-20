"""
Camera Routes (Single-Camera Architecture)

This file provides camera-related endpoints for the single-camera system.
Camera configuration is managed through settings endpoints in settings_routes.py.
"""

from fastapi import APIRouter, Depends
from src.utils.serialization import safe_json_response
from src.utils.auth import get_current_user_id
from src.controllers.camera_controller import get_camera_config_logic

router = APIRouter()


@router.get('/cameras/config/locations')
async def get_camera_locations():
    """Get camera location mapping for the single camera.
    
    Used by AI service to retrieve camera location for snapshot filename generation.
    Returns: {<camera_id>: <location_name>}
    Example: {"1": "Living Room"}
    """
    try:
        from database import db
        
        # Use raw SQL since Prisma Python client generation has issues
        result = await db.query_raw(
            'SELECT cc.loc_id FROM camera_config cc WHERE cc.id = 1 LIMIT 1'
        )
        
        if not result:
            return safe_json_response(
                status_code=200,
                content={'status': 'success', 'cameras': {}}
            )
        
        config = result[0] if isinstance(result, list) else result
        loc_id = config.get('loc_id') if isinstance(config, dict) else None
        
        loc_name = 'Unknown'
        if loc_id:
            loc_result = await db.query_raw(
                f'SELECT loc_name FROM location WHERE id = {loc_id} LIMIT 1'
            )
            if loc_result:
                loc = loc_result[0] if isinstance(loc_result, list) else loc_result
                loc_name = loc.get('loc_name') if isinstance(loc, dict) else str(loc)
        
        locations_map = {'1': loc_name}
        
        return safe_json_response(
            status_code=200,
            content={'status': 'success', 'cameras': locations_map}
        )
    except Exception as e:
        print(f"[ERROR] Failed to fetch camera location: {e}")
        return safe_json_response(
            status_code=500,
            content={'status': 'error', 'message': str(e)}
        )