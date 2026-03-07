from database import db

async def get_cameras_logic():
    cameras = await db.camera.find_many(include={"location": True})
    result = [{
        "id": cam.id,
        "name": cam.cam_name,
        "status": cam.cam_status,
        "stream_url": cam.stream_url,
        "location_name": cam.location.loc_name if cam.location else None
    } for cam in cameras]
    return result, 200

async def get_camera_logic(camera_id):
    camera = await db.camera.find_unique(
        where={"id": int(camera_id)},
        include={"location": True}
    )
    if not camera:
        return {"error": "Camera not found"}, 404
    return {
        "id": camera.id,
        "name": camera.cam_name,
        "location_name": camera.location.loc_name if camera.location else None
    }, 200

async def create_camera_logic(camera_data):
    try:
        new_camera = await db.camera.create(
            data={
                "cam_name": camera_data.get("cam_name"),
                "loc_id": int(camera_data.get("loc_id")),
                "stream_url": camera_data.get("stream_url"),
                "cam_status": True
            }
        )
        return {"status": "success", "camera_id": str(new_camera.id)}, 201
    except Exception as e:
        return {"error": str(e)}, 500