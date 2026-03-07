from flask import Blueprint, request, jsonify
from src.controllers.settings_controller import save_notifications_logic
from src.utils.auth import get_token_user_id

settings_routes = Blueprint('settings_routes', __name__)

@settings_routes.route('/settings/notifications', methods=['POST'])
async def save_notification_settings():
    user_id = get_token_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401

    # Get data from Request
    data = request.get_json()
    
    # 3. Call Controller Logic (Awaiting the async Prisma call)
    result, code = await save_notifications_logic(user_id, data)
    
    return jsonify(result), code