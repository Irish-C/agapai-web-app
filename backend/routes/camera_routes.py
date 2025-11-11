from flask import Blueprint, request, jsonify
from database import db
from models import Camera, Location
# --- ADDED IMPORTS ---
from flask_jwt_extended import jwt_required
import traceback
# --- END ADDED IMPORTS ---

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
@jwt_required() # <-- Added protection
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
        # cam_status defaults to True per model
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

@camera_routes.route('/cameras/<int:cam_id>', methods=['DELETE'])
@jwt_required() # <-- Added protection
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

# --- NEW ROUTE FOR SAVE SETTINGS ---
@camera_routes.route('/cameras/bulk-status', methods=['POST'])
@jwt_required()
def bulk_update_camera_status():
    """
    Receives a dictionary of camera statuses from the Settings page
    and updates them in the database.
    Input: { "statuses": { "1": true, "2": false, "3": true } }
    """
    try:
        data = request.get_json()
        statuses = data.get('statuses')

        if not isinstance(statuses, dict):
            return jsonify({"status": "error", "message": "Invalid data format. 'statuses' must be an object."}), 400

        # Efficiently fetch all cameras that need updating
        cam_ids = [int(id) for id in statuses.keys()]
        cameras_to_update = Camera.query.filter(Camera.id.in_(cam_ids)).all()
        
        # Create a map for quick lookup
        camera_map = {cam.id: cam for cam in cameras_to_update}
        
        updated_count = 0
        for cam_id_str, status_bool in statuses.items():
            cam = camera_map.get(int(cam_id_str))
            if cam:
                cam.cam_status = bool(status_bool)
                updated_count += 1
        
        db.session.commit()
        
        return jsonify({
            "status": "success", 
            "message": f"Updated status for {updated_count} cameras."
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error bulk updating cameras: {e}")
        print(traceback.format_exc())
        return jsonify({"status": "error", "message": "Internal server error"}), 500
# --- END NEW ROUTE ---


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
@jwt_required() # <-- Added protection
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

# --- NEW ROUTE FOR EDITING LOCATION ---
@camera_routes.route('/locations/<int:loc_id>', methods=['PATCH'])
@jwt_required()
def update_location(loc_id):
    """
    Updates a specific location's name.
    """
    try:
        # 1. Find the location
        loc = Location.query.get(loc_id)
        if not loc:
            return jsonify({"status": "error", "message": "Location not found"}), 404

        # 2. Get the new name
        data = request.get_json()
        new_name = data.get('loc_name')
        if not new_name:
            return jsonify({"status": "error", "message": "Missing 'loc_name'"}), 400

        # 3. Check for duplicates
        existing = Location.query.filter(Location.loc_name == new_name).first()
        if existing and existing.id != loc_id:
            return jsonify({"status": "error", "message": "A location with this name already exists"}), 409
        
        # 4. Update and save
        loc.loc_name = new_name
        db.session.commit()
        
        return jsonify({"status": "success", "message": "Location updated"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
# --- END NEW ROUTE ---

# --- NEW ROUTE FOR DELETING LOCATION ---
@camera_routes.route('/locations/<int:loc_id>', methods=['DELETE'])
@jwt_required()
def delete_location(loc_id):
    """
    Deletes a specific location.
    """
    try:
        # 1. Find the location
        loc = Location.query.get(loc_id)
        if not loc:
            return jsonify({"status": "error", "message": "Location not found"}), 404

        # 2. Check if any cameras are still assigned to this location
        # This enforces the 'ON DELETE RESTRICT' rule
        camera_exists = Camera.query.filter_by(loc_id=loc_id).first()
        if camera_exists:
            return jsonify({
                "status": "error", 
                "message": f"Cannot delete location. Re-assign or remove camera '{camera_exists.cam_name}' first."
            }), 400

        # 3. Delete the location
        db.session.delete(loc)
        db.session.commit()
        
        return jsonify({"status": "success", "message": f"Location '{loc.loc_name}' deleted"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
# --- END NEW ROUTE ---