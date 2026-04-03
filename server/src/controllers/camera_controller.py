import os
import time
import uuid
from database import db

# Minimal camera controller without streaming or model code.
# Provides basic CRUD logic used by camera routes. Streaming and MediaMTX
# management have been intentionally removed to start from scratch.

SNAPSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../static/snapshots'))
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

async def get_cameras_logic():
    cameras = await db.camera.find_many(include={"location": True})
    result = []
    for cam in cameras:
        # Hide archived cameras from management lists.
        if (cam.cam_name or '').startswith('[DELETED] '):
            continue

        cam_id = str(cam.id)
        result.append({
            "id": cam_id,
            "name": cam.cam_name,
            "status": cam.cam_status,
            "stream_url": cam.stream_url,
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
    return {"status": "disabled", "message": "publish_camera_to_mediamtx removed"}, 410

async def unpublish_camera_from_mediamtx(camera_id):
    return {"status": "disabled", "message": "unpublish_camera_from_mediamtx removed"}, 410
