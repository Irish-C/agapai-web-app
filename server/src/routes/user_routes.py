# server/routes/user_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from controllers.user_controller import login_logic, get_profile_logic, create_user_logic
# Import your admin_required decorator here

user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/login', methods=['POST'])
def login():
    result, code = login_logic(request.get_json())
    if "error" in result:
        return jsonify(msg=result["error"]), code
    return jsonify(result), code

@user_routes.route('/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    user_id = int(get_jwt_identity())
    result, code = get_profile_logic(user_id)
    return jsonify(result), code

@user_routes.route('/users', methods=['POST'])
@jwt_required()
# @admin_required  <-- Add your decorator here
def create_user():
    result, code = create_user_logic(request.get_json())
    return jsonify(result), code