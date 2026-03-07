from flask import Blueprint, request, jsonify
from src.utils.auth import get_token_user_id
from src.controllers.event_controller import get_event_logs_logic, mark_viewed_logic

event_routes = Blueprint('event_routes', __name__)

@event_routes.route('/event_logs', methods=['GET'])
async def get_event_logs():
    # Pass request.args for filtering
    result, code = await get_event_logs_logic(request.args)
    return jsonify(result), code

@event_routes.route('/events/<int:log_id>/acknowledge', methods=['POST'])
async def acknowledge_event(log_id):
    user_id = get_token_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    result, code = await mark_viewed_logic(log_id, user_id)
    return jsonify(result), code