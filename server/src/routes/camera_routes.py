from flask import Blueprint, request, jsonify
from src.middleware.auth import token_required
from src.controllers.camera_controller import (
    get_cameras_logic, 
    create_camera_logic, 
    get_camera_logic
)

camera_routes = Blueprint('camera_routes', __name__)

@camera_routes.route('/cameras', methods=['GET'])
@token_required
async def get_all_cameras():
    data, code = await get_cameras_logic()
    return jsonify({"status": "success", "cameras": data}), code

@camera_routes.route('/cameras/<int:camera_id>', methods=['GET'])
@token_required
async def get_single_camera(camera_id):
    result, code = await get_camera_logic(camera_id)
    return jsonify(result), code