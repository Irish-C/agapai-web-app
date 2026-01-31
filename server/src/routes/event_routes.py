from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.controllers.event_controller import get_event_logs_logic, mark_viewed_logic

event_routes = Blueprint('event_routes', __name__)

@event_routes.route('/events', methods=['GET'])
@jwt_required()
async def get_event_logs():
    # Pass request.args for filtering
    result, code = await get_event_logs_logic(request.args)
    return jsonify(result), code

@event_routes.route('/events/<int:log_id>/acknowledge', methods=['POST'])
@jwt_required()
async def acknowledge_event(log_id):
    user_id = get_jwt_identity()
    result, code = await mark_viewed_logic(log_id, user_id)
    return jsonify(result), code