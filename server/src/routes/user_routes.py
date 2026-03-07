from flask import Blueprint, request, jsonify
from src.controllers.user_controller import login_logic, get_profile_logic, create_user_logic
from src.middleware.auth import token_required
from src.utils.auth import get_token_user_id

# 1. Define the Blueprint
user_routes = Blueprint('user_routes', __name__)

# 2. Use the Blueprint object, NOT 'app'
@user_routes.route('/login', methods=['POST'])
async def login():
    response, status_code = await login_logic(request.get_json())
    return response, status_code

@user_routes.route('/user/profile', methods=['GET'])
@token_required
async def get_user_profile():
    user_id = get_token_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401

    result, code = await get_profile_logic(user_id)
    return jsonify(result), code