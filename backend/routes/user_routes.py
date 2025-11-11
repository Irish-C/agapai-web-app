from flask import Blueprint, request, jsonify
import bcrypt
from database import db
from models import User, Role
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

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
        # --- THIS IS THE FIX ---
        # The identity must be a string, not an integer.
        access_token = create_access_token(identity=str(user.id))
        # --- END FIX ---
        
        # Successful login
        
        # Get role name
        role_name = "User" # Default
        if user.role:
            role_name = user.role.role_name
        
        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user_id": user.id,  # From DB
            "username": user.username,  # From DB
            "role": role_name,
            "access_token": access_token
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

# --- NEW ROUTE ADDED ---
@user_routes.route('/users/change-password', methods=['POST'])
@jwt_required() # Ensures the user is logged in
def change_password():
    """
    Changes the password for the currently logged-in user.
    """
    try:
        # Get the user ID from the JWT token (it's a string)
        current_user_id_str = get_jwt_identity()
        user_id = int(current_user_id_str)
        
        data = request.get_json()
        new_password = data.get('new_password')

        if not new_password:
            return jsonify({"status": "error", "message": "New password is required"}), 400

        # Find the user in the database
        user = User.query.get(user_id)
        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        # Hash the new password
        hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        # Update and save the user
        user.password = hashed_pw.decode('utf-8')
        db.session.commit()
        
        return jsonify({"status": "success", "message": "Password updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error changing password: {e}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500
# --- END OF NEW ROUTE ---