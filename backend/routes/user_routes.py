from flask import Blueprint, request, jsonify

# Define a Flask Blueprint for user-related routes
user_routes = Blueprint('user_routes', __name__)

# --- Mock User Database ---
MOCK_USER_DB = {
    "admin": {"password": "password", "user_id": "u4567", "username": "Administrator"},
    "nurse": {"password": "secure", "user_id": "u1234", "username": "Nurse A"},
}

@user_routes.route('/login', methods=['POST'])
def login():
    """
    Handles user login via REST API (simulated authentication).
    """
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = MOCK_USER_DB.get(username)

    if user and user['password'] == password:
        # Successful login
        return jsonify({
            "status": "success",
            "message": "Login successful",
            "user_id": user['user_id'],
            "username": user['username'],
            "access_token": "mock_jwt_token_12345" # Mock JWT token
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