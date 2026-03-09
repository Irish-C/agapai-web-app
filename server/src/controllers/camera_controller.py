import cv2
import asyncio
import base64
from database import db

async def start_camera_processing():
    """
    Initial startup task. 
    It waits for the database to connect, then starts individual stream loops 
    for every camera marked as active (cam_status=True).
    """
    await asyncio.sleep(2) # Brief delay to ensure DB and Socket server are ready
    try:
        active_cameras = await db.camera.find_many(where={'cam_status': True})
        
        for cam in active_cameras:
            print(f"Starting background stream for: {cam.cam_name}")
            # Launch each camera in its own background task
            asyncio.create_task(stream_camera_loop(cam.id, cam.stream_url))
    except Exception as e:
        print(f"Error starting camera streams: {e}")

async def stream_camera_loop(camera_id, rtsp_url):
    """
    The main loop for a single camera. 
    Captures frames, encodes them to base64, and emits them via Socket.IO.
    """
    cap = cv2.VideoCapture(rtsp_url)

    try:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print(f"Stream failed for camera {camera_id}. Retrying in 5s...")
                await asyncio.sleep(5)
                cap = cv2.VideoCapture(rtsp_url)
                continue

            # 1. ENCODE FRAME: Convert the OpenCV image to a base64 string
            _, buffer = cv2.imencode('.jpg', frame)
            frame_base64 = base64.b64encode(buffer).decode('utf-8')

            # 2. EMIT TO FRONTEND: Send the frame via the shared socketio_server
            from app import socketio_server
            # Emit only the raw base64 payload (no data URI prefix) so the client can prepend
            # the appropriate scheme (`data:image/jpeg;base64,`) without duplicating it.
            await socketio_server.emit('camera_frame', {
                'cam_id': str(camera_id), # Cast BigInt to string for frontend compatibility
                'frame': frame_base64
            })

            # 3. FPS CONTROL: Slight sleep to prevent 100% CPU usage
            await asyncio.sleep(0.04) # Approx 25 FPS
    except asyncio.CancelledError:
        # Graceful shutdown: stop streaming when the task is cancelled (e.g., on server shutdown)
        pass
    finally:
        cap.release()
        print(f"Stopped stream for camera {camera_id}")

# --- EXISTING LOGIC UPDATED FOR BIGINT COMPATIBILITY ---

async def get_cameras_logic():
    cameras = await db.camera.find_many(include={"location": True})
    result = [{
        "id": str(cam.id), # Convert BigInt to string for JSON safety
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
        "id": str(camera.id), # Convert BigInt to string
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

# PATCH logic for updating camera details
async def update_camera_logic(camera_id, camera_data):
    try:
        cam_name = camera_data.get("cam_name")
        loc_id = camera_data.get("loc_id")
        stream_url = camera_data.get("stream_url")
        if loc_id is None:
            return {"error": "loc_id is required and cannot be None"}, 400
        updated_camera = await db.camera.update(
            where={"id": int(camera_id)},
            data={
                "cam_name": cam_name,
                "loc_id": int(loc_id),
                "stream_url": stream_url
            }
        )
        return {"status": "success", "camera_id": str(updated_camera.id)}, 200
    except Exception as e:
        return {"error": str(e)}, 500

async def delete_camera_logic(camera_id):
    try:
        await db.camera.delete(where={"id": int(camera_id)})
        return {"status": "success", "message": "Camera deleted"}, 200
    except Exception as e:
        return {"error": str(e)}, 500