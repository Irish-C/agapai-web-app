"""
Camera Controller (Single-Camera Architecture)

Provides controller logic for single camera configuration management.
"""

import os
import json
import requests
from database import db

SNAPSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../static/snapshots'))
os.makedirs(SNAPSHOT_DIR, exist_ok=True)


async def get_camera_config_logic():
    """Fetch the single camera configuration (view-only)."""
    try:
        # Use raw SQL query since Prisma Python client generation has issues
        result = await db.query_raw(
            'SELECT id, cam_name, stream_url, loc_id, status FROM camera_config WHERE id = 1 LIMIT 1'
        )
        
        if not result:
            return {
                "id": 1,
                "name": None,
                "stream_url": None,
                "status": "inactive",
                "location_name": None,
            }, 404
        
        config = result[0] if isinstance(result, list) else result
        
        # Get location name
        location_name = None
        if config.get('loc_id'):
            loc_id = config['loc_id']
            # Construct query with loc_id directly (safe since it's from database)
            location_result = await db.query_raw(
                f'SELECT loc_name FROM location WHERE id = {loc_id} LIMIT 1'
            )
            if location_result:
                loc = location_result[0] if isinstance(location_result, list) else location_result
                location_name = loc.get('loc_name') if isinstance(loc, dict) else loc
        
        return {
            "id": 1,
            "name": config.get('cam_name'),
            "stream_url": config.get('stream_url'),
            "status": config.get('status'),
            "location_id": config.get('loc_id'),
            "location_name": location_name,
            "playback_url": "http://localhost:3000/api/video_feed?camera_id=1"
        }, 200
    except Exception as e:
        print(f"[get_camera_config] Error: {e}")
        return {"error": str(e)}, 500


async def update_camera_config_logic(data):
    """Update the single camera configuration (admin-only)."""
    try:
        cam_name = data.get('cam_name', '').strip()
        stream_url = data.get('stream_url', '').strip()
        loc_id = data.get('loc_id')
        
        if not cam_name:
            return {"status": "error", "message": "Camera name is required"}, 400
        
        if not stream_url:
            return {"status": "error", "message": "Stream URL is required"}, 400
        
        # Validate location if provided
        if loc_id:
            loc_id = int(loc_id)
            loc_result = await db.query_raw(
                f'SELECT id FROM location WHERE id = {loc_id} LIMIT 1'
            )
            if not loc_result:
                return {"status": "error", "message": "Invalid location"}, 400
        else:
            loc_id = None
        
        # Update camera config using raw SQL
        # Escape single quotes in string values for SQL injection prevention
        escaped_name = cam_name.replace("'", "''")
        escaped_url = stream_url.replace("'", "''")
        loc_id_sql = f"{loc_id}" if loc_id else "NULL"
        
        update_query = f"""
            UPDATE camera_config 
            SET cam_name = '{escaped_name}', stream_url = '{escaped_url}', loc_id = {loc_id_sql}, updated_at = CURRENT_TIMESTAMP
            WHERE id = 1;
        """
        
        try:
            await db.query_raw(update_query)
        except Exception as update_err:
            print(f"[update_camera_config] SQL Update Error: {update_err}")
            return {"status": "error", "message": f"Database update failed: {str(update_err)}"}, 500
        
        # Return updated config
        result, status = await get_camera_config_logic()
        return result, status
    except ValueError:
        return {"status": "error", "message": "Invalid location ID format"}, 400
    except Exception as e:
        print(f"[update_camera_config] Error: {e}")
        return {"status": "error", "message": str(e)}, 500


async def start_camera_detection_logic():
    """Start AI detection for the single camera."""
    try:
        # Use raw SQL query
        result = await db.query_raw(
            'SELECT stream_url, loc_id FROM camera_config WHERE id = 1 LIMIT 1'
        )
        
        if not result:
            return {"error": "No camera configured"}, 404
        
        config = result[0] if isinstance(result, list) else result
        stream_url = config.get('stream_url') if isinstance(config, dict) else config
        loc_id = config.get('loc_id') if isinstance(config, dict) else None
        
        if not stream_url:
            return {"error": "Camera has no stream URL"}, 400
        
        print(f"[start_camera] Retrieved RTSP URL: {stream_url[:60]}...")
        
        # Fetch location name if location is set
        location_name = "Unknown"
        if loc_id:
            try:
                loc_result = await db.query_raw(
                    f'SELECT loc_name FROM location WHERE id = {loc_id} LIMIT 1'
                )
                if loc_result:
                    loc = loc_result[0] if isinstance(loc_result, list) else loc_result
                    location_name = loc.get('loc_name') if isinstance(loc, dict) else loc
                print(f"[start_camera] Location: {location_name}")
            except Exception as loc_err:
                print(f"[start_camera] Warning: Could not fetch location: {loc_err}")
        
        # Trigger AI service to start detection with location
        try:
            print(f"[start_camera] Calling AI service /api/start...")
            response = requests.post(
                'http://localhost:3000/api/start',
                json={
                    'camera_id': 1,
                    'rtsp_url': stream_url,
                    'location_name': location_name
                },
                timeout=10  # Increased timeout to 10 seconds for connection attempts
            )
            if response.status_code == 200:
                print(f"[start_camera] ✓ AI service started successfully for location: {location_name}")
                return {"status": "success", "message": "Detection started"}, 200
            else:
                print(f"[start_camera] ⚠ AI service returned {response.status_code}: {response.text[:100]}")
                return {"status": "success", "message": f"Detection started (AI returned {response.status_code})"}, 200
        except requests.exceptions.Timeout:
            print(f"[start_camera] ⚠ AI service timeout (>10s)")
            return {"status": "warning", "message": "AI service timeout - check RTSP URL validity"}, 200
        except requests.exceptions.ConnectionError as conn_err:
            print(f"[start_camera] ⚠ AI service unavailable: {conn_err}")
            return {"status": "warning", "message": "AI service unavailable - is it running on port 3000?"}, 200
    except Exception as e:
        print(f"[start_camera_detection] Error: {e}")
        return {"error": str(e)}, 500


async def stop_camera_detection_logic():
    """Stop AI detection for the single camera."""
    try:
        # Trigger AI service to stop detection
        try:
            response = requests.post(
                'http://localhost:3000/api/stop',
                json={'camera_id': 1},
                timeout=5
            )
            if response.status_code == 200:
                print(f"[stop_camera_detection] ✓ AI service stopped")
                return {"status": "success", "message": "Detection stopped"}, 200
            else:
                print(f"[stop_camera_detection] ⚠ AI service returned {response.status_code}")
                return {"status": "success", "message": "Detection stopped (AI service warning)"}, 200
        except requests.exceptions.Timeout:
            print(f"[stop_camera_detection] ⚠ AI service timeout")
            return {"status": "success", "message": "Detection stopped (AI timeout)"}, 200
        except requests.exceptions.ConnectionError:
            print(f"[stop_camera_detection] ⚠ AI service unavailable")
            return {"status": "success", "message": "Detection stopped (AI unavailable)"}, 200
    except Exception as e:
        print(f"[stop_camera_detection] Error: {e}")
        return {"error": str(e)}, 500
