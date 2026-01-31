from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.controllers.user_controller import login_logic, get_profile_logic, create_user_logic
from database import db
# from src.utils.decorators import admin_required
user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/login', methods=['POST'])
async def login():
    # We use await here because the new Prisma login_logic is asynchronous
    response, status_code = await login_logic(request.get_json())
    return response, status_code

@user_routes.route('/logout', methods=['POST'])
@jwt_required()
async def logout():
    # 1. Get identity from JWT
    user_id = get_jwt_identity()

    # 2. Call Controller Logic (Awaiting the async Prisma call)
    result, code = await logout_logic(user_id)
    
    # Check for either "error" or "message" depending on your controller's keys
    if "status" in result and result["status"] == "error":
        return jsonify(result), code
    return jsonify(result), code

@user_routes.route('/user/profile', methods=['GET'])
@jwt_required()
async def get_user_profile():
    # Identity from JWT is usually a string; we await the profile fetch
    user_id = str(get_jwt_identity())
    result, code = await get_profile_logic(user_id)
    return jsonify(result), code

@user_routes.route('/users', methods=['POST'])
@jwt_required()
# @admin_required
async def create_user():
    # Awaiting the creation logic which now uses Prisma's .create()
    result, code = await create_user_logic(request.get_json())
    return jsonify(result), code