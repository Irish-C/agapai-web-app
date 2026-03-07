from flask import Blueprint, request, jsonify
from src.utils.auth import get_token_user_id
from src.controllers.event_controller import (
    get_event_logs_logic, 
    mark_viewed_logic, 
    create_event_logic  # New logic function
)

event_routes = Blueprint('event_routes', __name__)

@event_routes.route('/events', methods=['POST'])
async def create_event():
    """Route for AI/Cameras to post new detections"""
    data = request.json
    result, code = await create_event_logic(data)
    return jsonify(result), code

@event_routes.route('/event_logs', methods=['GET'])
async def get_event_logs():
    result, code = await get_event_logs_logic(request.args)
    return jsonify(result), code

@event_routes.route('/events/<int:log_id>/acknowledge', methods=['POST'])
async def acknowledge_event(log_id):
    user_id = get_token_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    result, code = await mark_viewed_logic(log_id, user_id)
    return jsonify(result), code