# server/controllers/camera_controller.py
from models import Camera, Location
from database import db

def get_cameras_logic():
    cameras = Camera.query.all()
    return [{
        "id": cam.id,
        "name": cam.cam_name,
        "status": cam.cam_status,
        "stream_url": cam.stream_url,
        "location_name": cam.location.loc_name if cam.location else None
    } for cam in cameras]

def create_camera_logic(data):
    cam_name = data.get('cam_name')
    loc_id = data.get('loc_id')
    stream_url = data.get('stream_url')

    if not cam_name or not loc_id:
        return {"error": "Missing fields", "code": 400}

    new_camera = Camera(cam_name=cam_name, loc_id=loc_id, stream_url=stream_url)
    db.session.add(new_camera)
    db.session.commit()
    return {"status": "success", "camera_id": new_camera.id, "code": 201}