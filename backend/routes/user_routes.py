# backend/routes/user_routes.py

from flask import Blueprint, request, jsonify
import bcrypt
from database import db
from models import User, Role # Ensure User and Role are imported
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from functools import wraps
import traceback # Used for debugging server crashes
from flask import current_app, jsonify

user_routes = Blueprint('user_routes', __name__)

def admin_required(fn):
    """
    Decorator that checks if the logged-in user's role is 'Admin'.
    """
    @wraps(fn)
    @jwt_required()
    def decorator(*args, **kwargs):
        try:
            user_id_str = get_jwt_identity()
            user_id = int(user_id_str)
            user = User.query.get(user_id)
            
            if user and user.role and user.role.role_name == 'Admin':
                return fn(*args, **kwargs)
            else:
                return jsonify(msg="Administration rights required"), 403
        except Exception:
            return jsonify(msg="Invalid user context."), 500
    return decorator


@user_routes.route('/login', methods=['POST'])
def login():
    """ Handles user login via REST API. """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "error", "message": "Missing username or password"}), 400

    user = User.query.filter_by(username=username).first()

    if user and user.password:
        
        is_password_valid = bcrypt.checkpw(
            password.encode('utf-8'),
            user.password.encode('utf-8')
        )

        if is_password_valid:
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

@user_routes.route('/logout', methods=['POST'])
def logout():
    return jsonify({"status": "success", "message": "Logout successful"}), 200


@user_routes.route('/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    try:
        # 🛑 FIX: Explicitly push the application context
        with current_app.app_context(): 
            user_id_str = get_jwt_identity()
            user_id = int(user_id_str)
            
            # Database query is executed inside this context
            user = User.query.get(user_id) 

            if not user:
                return jsonify(msg="User not found"), 404

            # Defensive data retrieval
            role_name = user.role.role_name if user.role else 'User' 

            profile_data = {
                'firstname': user.firstname or 'N/A', 
                'lastname': user.lastname or 'User',
                'username': user.username,
                'role': role_name
            }

            return jsonify(profile_data), 200

    except Exception as e:
        # If the code reaches here, it means a network or configuration error occurred
        import traceback
        traceback.print_exc() 
        return jsonify(msg="Internal server error fetching profile."), 500
    

@user_routes.route('/users', methods=['GET'])
@admin_required # <-- Ensure admin_required decorator is used
def get_all_users():
    """
    Returns a list of all users in the system. Requires Admin role.
    """
    try:
        # NOTE: Ensure you are importing current_app and using app_context
        from flask import current_app 
        with current_app.app_context():
            users = User.query.all()
            
            user_list = []
            for user in users:
                role_name = user.role.role_name if user.role else 'staff'
                user_list.append({
                    'id': user.id,
                    'username': user.username,
                    'firstname': user.firstname or 'N/A',
                    'lastname': user.lastname or 'User', 
                    'role': role_name,
                    'userId': user.id 
                })
            return jsonify(user_list), 200

    except Exception as e:
        import traceback
        traceback.print_exc() 
        return jsonify({'status': 'error', 'message': 'Internal server error while fetching users'}), 500