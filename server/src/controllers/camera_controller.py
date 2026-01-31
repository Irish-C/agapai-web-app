from database import db

async def get_cameras_logic():
    # Use Prisma's find_many and include the location relation
    # This replaces Camera.query.all() and SQLAlchemy's lazy loading
    cameras = await db.camera.find_many(include={"location": True})
    
    result = [{
        "id": cam.id,
        "name": cam.cam_name,
        "status": cam.cam_status,
        "stream_url": cam.stream_url,
        "location_name": cam.location.loc_name if cam.location else None
    } for cam in cameras]
    
    return result, 200

async def create_camera_logic(data):
    cam_name = data.get('cam_name')
    loc_id = data.get('loc_id')
    stream_url = data.get('stream_url')

    if not cam_name or not loc_id:
        return {"error": "Missing fields"}, 400

    try:
        # Prisma uses .create() with a 'data' dictionary
        # Note: BigInt IDs from request are usually strings, so we cast to int
        new_camera = await db.camera.create(
            data={
                "cam_name": cam_name,
                "loc_id": int(loc_id),
                "stream_url": stream_url,
                "cam_status": True
            }
        )
        
        return {
            "status": "success", 
            "camera_id": str(new_camera.id) # Convert BigInt to string for JSON
        }, 201
        
    except Exception as e:
        print(f"Error creating camera: {e}")
        return {"error": "Could not create camera"}, 500