from flask import Blueprint, request, jsonify
import bcrypt
from database import db
from models import User, Role
from flask_jwt_extended import create_access_token

# Define a Flask Blueprint for user-related routes
user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/login', methods=['POST'])
def login():
    """
    Handles user login via REST API (tunay na authentication).
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "error", "message": "Missing username or password"}), 400

    # 1. Find user by username
    user = User.query.filter_by(username=username).first()

    # 2. Verify password using bcrypt
    if user and bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        access_token = create_access_token(identity=user.id)
        # Successful login
        
        # Get role name
        role_name = "User" # Default
        if user.role:
            role_name = user.role.role_name
        
        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user_id": user.id,
            "username": user.username,
            "role": role_name,
            "access_token": access_token,
        
            "firstname": user.firstname 

        }), 200
    else:
        # Failed login
        return jsonify({
            "status": "error",
            "message": "Invalid username or password"
        }), 401

@user_routes.route('/logout', methods=['POST'])
def logout():
    """
    Handles user logout (session/token invalidation placeholder).
    """
    # In a real app, this would invalidate the JWT token or session
    return jsonify({
        "status": "success",
        "message": "Logout successful"
    }), 200