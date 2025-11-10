# backend/routes/camera_routes.py
from flask import Blueprint, request, jsonify
from database import db
from models import Camera, Location

# Define a Flask Blueprint
camera_routes = Blueprint('camera_routes', __name__)

# --- Camera Routes ---

@camera_routes.route('/cameras', methods=['GET'])
def get_all_cameras():
    """
    GET all cameras from the database.
    """
    try:
        cameras = Camera.query.all()
        
        # Convert the list of camera objects into a list of dictionaries
        camera_list = []
        for cam in cameras:
            camera_list.append({
                "id": cam.id,
                "name": cam.cam_name,
                "status": cam.cam_status,
                "stream_url": cam.stream_url,
                "location_id": cam.loc_id,
                # Safely access the location name
                "location_name": cam.location.loc_name if cam.location else None
            })
            
        return jsonify({"status": "success", "cameras": camera_list}), 200
    
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@camera_routes.route('/cameras', methods=['POST'])
def create_camera():
    """
    POST a new camera to the database.
    """
    data = request.get_json()
    cam_name = data.get('cam_name')
    stream_url = data.get('stream_url')
    loc_id = data.get('loc_id')

    if not cam_name or not loc_id:
        return jsonify({"status": "error", "message": "Missing 'cam_name' or 'loc_id'"}), 400

    # Check if location exists
    location = Location.query.get(loc_id)
    if not location:
         return jsonify({"status": "error", "message": "Location not found"}), 404

    # Create the new Camera object
    new_camera = Camera(
        cam_name=cam_name,
        stream_url=stream_url,
        loc_id=loc_id
        # cam_status defaults to True per your model
    )

    try:
        db.session.add(new_camera)
        db.session.commit()
        
        # Return the newly created camera object
        return jsonify({
            "status": "success",
            "message": "Camera created",
            "camera": {
                "id": new_camera.id,
                "name": new_camera.cam_name,
                "stream_url": new_camera.stream_url,
                "location_id": new_camera.loc_id,
                "location_name": location.loc_name
            }
        }), 201 # 201 means "Created"
        
    except Exception as e:
        db.session.rollback() # Roll back changes if an error occurs
        return jsonify({"status": "error", "message": str(e)}), 500

# --- Location Routes ---

@camera_routes.route('/locations', methods=['GET'])
def get_all_locations():
    """
    GET all locations from the database.
    """
    try:
        locations = Location.query.all()
        location_list = [{"id": loc.id, "name": loc.loc_name} for loc in locations]
        return jsonify({"status": "success", "locations": location_list}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@camera_routes.route('/locations', methods=['POST'])
def create_location():
    """
    POST a new location to the database.
    """
    data = request.get_json()
    loc_name = data.get('loc_name')

    if not loc_name:
        return jsonify({"status": "error", "message": "Missing 'loc_name'"}), 400

    # Check if location already exists
    if Location.query.filter_by(loc_name=loc_name).first():
        return jsonify({"status": "error", "message": "Location already exists"}), 409

    new_location = Location(loc_name=loc_name)

    try:
        db.session.add(new_location)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "message": "Location created",
            "location": { "id": new_location.id, "loc_name": new_location.loc_name }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    
@camera_routes.route('/cameras/<int:cam_id>', methods=['DELETE'])
def delete_camera(cam_id):
    """
    DELETE a specific camera by its ID.
    """
    try:
        # 1. Find the camera
        camera = Camera.query.get(cam_id)
        
        if not camera:
            return jsonify({"status": "error", "message": "Camera not found"}), 404

        # 2. Delete it from the database
        db.session.delete(camera)
        db.session.commit()
        
        return jsonify({"status": "success", "message": f"Camera {cam_id} deleted"}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500