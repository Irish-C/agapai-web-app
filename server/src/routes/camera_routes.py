# server/src/routes/camera_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from controllers.camera_controller import get_cameras_logic, create_camera_logic

camera_routes = Blueprint('camera_routes', __name__)

@camera_routes.route('/cameras', methods=['GET'])
def get_all_cameras():
    # Route calls the controller logic
    data = get_cameras_logic()
    return jsonify({"status": "success", "cameras": data}), 200

@camera_routes.route('/cameras', methods=['POST'])
@jwt_required()
def create_camera():
    # Route passes request data to the controller
    result = create_camera_logic(request.get_json())
    
    if "error" in result:
        return jsonify({"status": "error", "message": result["error"]}), result["code"]
        
    return jsonify(result), result["code"]