from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.controllers.settings_controller import save_notifications_logic

settings_routes = Blueprint('settings_routes', __name__)

@settings_routes.route('/settings/notifications', methods=['POST'])
@jwt_required()
async def save_notification_settings():
    # 1. Get identity from JWT
    user_id = get_jwt_identity()
    
    # 2. Get data from Request
    data = request.get_json()
    
    # 3. Call Controller Logic (Awaiting the async Prisma call)
    result, code = await save_notifications_logic(user_id, data)
    
    return jsonify(result), code