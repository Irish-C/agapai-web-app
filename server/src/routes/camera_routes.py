from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from src.controllers.camera_controller import get_cameras_logic, create_camera_logic

camera_routes = Blueprint('camera_routes', __name__)

@camera_routes.route('/cameras', methods=['GET'])
async def get_all_cameras():
    # Controller logic is now async to support Prisma
    data, code = await get_cameras_logic()
    return jsonify({"status": "success", "cameras": data}), code

@camera_routes.route('/cameras', methods=['POST'])
@jwt_required()
async def create_camera():
    # Pass JSON data and await the creation process
    result, code = await create_camera_logic(request.get_json())
    
    # Handle the response based on the controller result
    if "error" in result:
        return jsonify({"status": "error", "message": result["error"]}), code
        
    return jsonify(result), code