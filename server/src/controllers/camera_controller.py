import os
import time
import uuid
import requests
from database import db

# Minimal camera controller without streaming or model code.
# Provides basic CRUD logic used by camera routes. Streaming and MediaMTX
# management have been intentionally removed to start from scratch.

SNAPSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../static/snapshots'))
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

async def get_cameras_logic(include_archived=False):
    cameras = await db.camera.find_many(include={"location": True})
    result = []
    for cam in cameras:
        # Optionally hide archived cameras from management lists.
        is_archived = (cam.cam_name or '').startswith('[DELETED] ')
        if is_archived and not include_archived:
            continue
        if not is_archived and include_archived:
            continue  # If showing archived, skip active cameras

        cam_id = str(cam.id)
        # Construct playback URL from AI service MJPEG endpoint
        try:
            # AI service streams MJPEG from /api/video_feed?camera_id={id}
            # Frontend proxies this via /mjpeg/?camera_id={id}
            playback_url = f"http://localhost:3000/api/video_feed?camera_id={cam_id}"
        except Exception:
            playback_url = None

        result.append({
            "id": cam_id,
            "name": cam.cam_name,
            "status": cam.cam_status,
            "stream_url": cam.stream_url,
            "playback_url": playback_url,
            "location_name": cam.location.loc_name if cam.location else None,
        })
    return result, 200

async def get_camera_logic(camera_id):
    camera = await db.camera.find_unique(
        where={"id": int(camera_id)},
        include={"location": True}
    )
    if not camera:
        return {"error": "Camera not found"}, 404
    cam_id = str(camera.id)
    return {
        "id": cam_id,
        "name": camera.cam_name,
        "location_name": camera.location.loc_name if camera.location else None,
    }, 200

async def create_camera_logic(camera_data):
    try:
        data_payload = {
            "cam_name": camera_data.get("cam_name"),
            "loc_id": int(camera_data.get("loc_id")),
            "stream_url": camera_data.get("stream_url"),
            "cam_status": True
        }

        new_camera = await db.camera.create(data=data_payload)
        return {"status": "success", "camera_id": str(new_camera.id)}, 201
    except Exception as e:
        return {"error": str(e)}, 500

async def update_camera_logic(camera_id, camera_data):
    try:
        cam_name = camera_data.get("cam_name")
        loc_id = camera_data.get("loc_id")
        stream_url = camera_data.get("stream_url")
        if loc_id is None:
            return {"error": "loc_id is required and cannot be None"}, 400
        update_payload = {
            "cam_name": cam_name,
            "loc_id": int(loc_id),
            "stream_url": stream_url
        }

        updated_camera = await db.camera.update(
            where={"id": int(camera_id)},
            data=update_payload
        )

        return {"status": "success", "camera_id": str(updated_camera.id)}, 200
    except Exception as e:
        return {"error": str(e)}, 500

async def delete_camera_logic(camera_id):
    try:
        camera = await db.camera.find_unique(where={"id": int(camera_id)})
        if not camera:
            return {"error": "Camera not found"}, 404

        # Archive instead of hard delete so incident history keeps camera linkage.
        archived_name = camera.cam_name
        if not (camera.cam_name or '').startswith('[DELETED] '):
            archived_name = f"[DELETED] {camera.cam_name}"

        await db.camera.update(
            where={"id": int(camera_id)},
            data={
                "cam_name": archived_name,
                "cam_status": False,
                "stream_url": f"deleted://camera/{int(camera_id)}"
            }
        )

        return {"status": "success", "message": "Camera archived."}, 200
    except Exception as e:
        return {"error": str(e)}, 500

# Stubs for MediaMTX actions (disabled)
async def publish_camera_to_mediamtx(camera_id):
    """Auto-trigger AI service to start detection when camera is published."""
    try:
        camera = await db.camera.find_unique(where={"id": int(camera_id)})
        if not camera:
            return {"error": "Camera not found"}, 404
        original_rtsp = camera.stream_url
        if not original_rtsp:
            return {"error": "Camera has no stream_url"}, 400

        # AUTO-TRIGGER STANDALONE AI SERVICE
        print(f"[camera_controller] ✓ Publishing camera {camera_id} - triggering AI service")
        try:
            response = requests.post(
                'http://localhost:3000/api/start',
                json={
                    'camera_id': int(camera_id),
                    'rtsp_url': original_rtsp
                },
                timeout=5
            )
            if response.status_code == 200:
                ai_response = response.json()
                print(f"[camera_controller] ✓ AI service started for camera {camera_id}")
                return {
                    "status": "success",
                    "message": f"Camera {camera_id} published with AI detection",
                    "ai_status": "started"
                }, 200
            else:
                print(f"[camera_controller] ⚠ AI service returned {response.status_code}")
                return {
                    "status": "success",
                    "message": f"Camera {camera_id} published but AI service returned error",
                    "ai_status": "error"
                }, 200
        except requests.exceptions.ConnectionError:
            print(f"[camera_controller] ⚠ AI service unavailable (connection error)")
            return {
                "status": "success",
                "message": f"Camera {camera_id} published but AI service is unavailable",
                "ai_status": "unavailable"
            }, 200
        except requests.exceptions.Timeout:
            print(f"[camera_controller] ⚠ AI service timeout")
            return {
                "status": "success",
                "message": f"Camera {camera_id} published but AI service timeout",
                "ai_status": "timeout"
            }, 200
    except Exception as e:
        print(f"[camera_controller] ✗ Error publishing camera: {str(e)}")
        return {"error": str(e)}, 500

async def unpublish_camera_from_mediamtx(camera_id):
    """Stop AI service detection when camera is unpublished."""
    try:
        print(f"[camera_controller] ✓ Unpublishing camera {camera_id} - stopping AI service")
        try:
            response = requests.post(
                'http://localhost:3000/api/stop',
                json={'camera_id': int(camera_id)},
                timeout=5
            )
            if response.status_code == 200:
                print(f"[camera_controller] ✓ AI service stopped for camera {camera_id}")
                return {
                    "status": "success",
                    "message": f"Camera {camera_id} unpublished, AI stopped",
                    "ai_status": "stopped"
                }, 200
            else:
                print(f"[camera_controller] ⚠ AI service returned {response.status_code}")
                return {
                    "status": "success",
                    "message": f"Camera {camera_id} unpublished but AI service error",
                    "ai_status": "error"
                }, 200
        except requests.exceptions.ConnectionError:
            print(f"[camera_controller] ⚠ AI service unavailable (connection error)")
            return {
                "status": "success",
                "message": f"Camera {camera_id} unpublished but AI service is unavailable",
                "ai_status": "unavailable"
            }, 200
        except requests.exceptions.Timeout:
            print(f"[camera_controller] ⚠ AI service timeout")
            return {
                "status": "success",
                "message": f"Camera {camera_id} unpublished but AI service timeout",
                "ai_status": "timeout"
            }, 200
    except Exception as e:
        print(f"[camera_controller] ✗ Error unpublishing camera: {str(e)}")
        return {"error": str(e)}, 500

async def permanently_delete_camera_logic(camera_id):
    """Permanently delete an archived camera (hard delete from database)."""
    try:
        camera = await db.camera.find_unique(where={"id": int(camera_id)})
        if not camera:
            return {"error": "Camera not found"}, 404
        
        # Try to stop AI detection before deletion
        try:
            requests.post(
                'http://localhost:3000/api/stop',
                json={'camera_id': int(camera_id)},
                timeout=3
            )
        except Exception as e:
            print(f"[camera_controller] Warning: Failed to stop AI service: {e}")
        
        # Hard delete from database
        await db.camera.delete(where={"id": int(camera_id)})
        return {"status": "success", "message": f"Camera permanently deleted"}, 200
    except Exception as e:
        return {"error": str(e)}, 500

async def get_archived_cameras_logic():
    """Retrieve all archived (deleted) cameras for admin review."""
    cameras = await db.camera.find_many(include={"location": True})
    result = []
    for cam in cameras:
        if not (cam.cam_name or '').startswith('[DELETED] '):
            continue  # Only show archived cameras
        
        cam_id = str(cam.id)
        # Extract original name by removing [DELETED] prefix
        original_name = cam.cam_name.replace('[DELETED] ', '') if cam.cam_name else 'Unknown'
        result.append({
            "id": cam_id,
            "name": cam.cam_name,
            "original_name": original_name,
            "location_name": cam.location.loc_name if cam.location else None,
            "stream_url": cam.stream_url,
        })
    return result, 200

async def restore_camera_logic(camera_id):
    """Restore an archived camera back to active status."""
    try:
        camera = await db.camera.find_unique(where={"id": int(camera_id)})
        if not camera:
            return {"error": "Camera not found"}, 404
        
        # Check if it's actually archived
        if not (camera.cam_name or '').startswith('[DELETED] '):
            return {"error": "Camera is not archived"}, 400
        
        # Remove [DELETED] prefix and restore the camera
        restored_name = camera.cam_name.replace('[DELETED] ', '')
        # Restore stream URL (try to recover original RTSP URL pattern)
        restored_stream_url = camera.stream_url
        if restored_stream_url.startswith('deleted://'):
            # If we have original RTSP, great; otherwise user will need to update it
            restored_stream_url = 'rtsp://example-camera-url'  # Default placeholder
        
        await db.camera.update(
            where={"id": int(camera_id)},
            data={
                "cam_name": restored_name,
                "cam_status": True,
                "stream_url": restored_stream_url
            }
        )
        return {"status": "success", "message": f"Camera '{restored_name}' restored and auto-published"}, 200
    except Exception as e:
        return {"error": str(e)}, 500
