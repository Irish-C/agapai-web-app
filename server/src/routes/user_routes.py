from flask import Blueprint, request, jsonify
from src.controllers.user_controller import login_logic, get_profile_logic, create_user_logic
from src.utils.auth import get_token_user_id

user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/login', methods=['POST'])
async def login():
    # We use await here because the new Prisma login_logic is asynchronous
    response, status_code = await login_logic(request.get_json())
    return response, status_code

@user_routes.route('/user/profile', methods=['GET'])
async def get_user_profile():
    user_id = get_token_user_id()
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401

    result, code = await get_profile_logic(user_id)
    return jsonify(result), code

@user_routes.route('/users', methods=['POST'])
# @admin_required
async def create_user():
    # Awaiting the creation logic which now uses Prisma's .create()
    result, code = await create_user_logic(request.get_json())
    return jsonify(result), code