# backend/routes/user_routes.py

from flask import Blueprint, request, jsonify
import bcrypt
from database import db
from models import User, Role
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from functools import wraps
import traceback

# Define a Flask Blueprint for user-related routes
user_routes = Blueprint('user_routes', __name__)

def admin_required(fn):
    """
    Decorator that checks if the logged-in user's role is 'Admin'.
    """
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        try:
            # 1. Get the user ID from the JWT token (stored as a string)
            user_id_str = get_jwt_identity()
            user_id = int(user_id_str)
            
            # 2. Load the user object from the database
            user = User.query.get(user_id)
            
            # 3. CRITICAL CHECK: Verify user exists and role_name is 'Admin'
            if user and user.role and user.role.role_name == 'Admin':
                return fn(*args, **kwargs) # Success: Run the protected route function
            else:
                # Failure: Return 403 Forbidden
                return jsonify(msg="Administration rights required"), 403
        except Exception:
            # Handle cases where the token is valid but data is corrupted (e.g., user deleted)
            return jsonify(msg="Invalid user context."), 500
    return decorator


# --- Existing Login Route (Includes defensive check) ---

@user_routes.route('/login', methods=['POST'])
def login():
    """ Handles user login via REST API. """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "error", "message": "Missing username or password"}), 400

    user = User.query.filter_by(username=username).first()

    # Defensive Password Check and Verification
    if user and user.password:
        
        is_password_valid = bcrypt.checkpw(
            password.encode('utf-8'),
            user.password.encode('utf-8')
        )

        if is_password_valid:
            # Token creation moved inside the successful block
            access_token = create_access_token(identity=str(user.id)) 
            
            role_name = user.role.role_name if user.role else 'User' 
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "user_id": user.id,
                "username": user.username,
                "role": role_name,
                "access_token": access_token
            }), 200

    return jsonify({
        "status": "error",
        "message": "Invalid username or password"
    }), 401

# --- Existing Logout and Change Password Routes (omitted for brevity) ---
@user_routes.route('/logout', methods=['POST'])
def logout():
    return jsonify({"status": "success", "message": "Logout successful"}), 200

# Placeholder for change_password route
# @user_routes.route('/users/change-password', methods=['POST'])
# @jwt_required()
# def change_password():
#     # ... implementation ...
#     pass


# --- NEW ROUTE: Fetch All Users (Admin Only) ---

@user_routes.route('/users', methods=['GET'])
@admin_required 
def get_all_users():
    """
    Returns a list of all users in the system. Requires Admin role.
    """
    try:
        users = User.query.all()
        
        user_list = []
        for user in users:
            role_name = user.role.role_name if user.role else 'User'
            user_list.append({
                'id': user.id,
                'username': user.username,
                'firstname': user.firstname,
                'lastname': user.lastname,
                'role': role_name,
                'userId': user.id 
            })
            
        return jsonify(user_list), 200

    except Exception as e:
        traceback.print_exc() 
        return jsonify({'status': 'error', 'message': 'Internal server error while fetching users'}), 500