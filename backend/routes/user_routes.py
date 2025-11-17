# backend/routes/user_routes.py

from flask import Blueprint, request, jsonify, current_app 
import bcrypt
from database import db
from models import User, Role # Ensure User and Role are imported
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from functools import wraps
import traceback # Used for debugging server crashes
from flask import current_app, jsonify
from models import User, Role, EventLog

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


# backend/routes/user_routes.py (Inside get_user_profile)

@user_routes.route('/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    try:
        from flask import current_app
        with current_app.app_context(): 
            user_id_str = get_jwt_identity()
            user_id = int(user_id_str)
            user = User.query.get(user_id) 

            if not user:
                return jsonify(msg="User not found"), 404

            role_name = user.role.role_name if user.role else 'User' 

            profile_data = {
                # 🛑 CRITICAL: Ensure KEYS match frontend expectations (lowercase keys are safer)
                'firstname': user.firstname or 'N/A', 
                'lastname': user.lastname or 'User',
                'username': user.username,
                'role': role_name
            }

            return jsonify(profile_data), 200 # <-- Returns the data object directly

    except Exception as e:
        # ... (error handling) ...
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
    
# backend/routes/user_routes.py (Revised change_password function)

@user_routes.route('/users/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Handles changing the user's password. Requires old password verification.
    """
    # NOTE: Since @jwt_required() runs successfully, the token is VALID.
    # The crash is only happening because the database connection (inside SQLAlchemy) 
    # interferes with the context required by get_jwt_identity().
    
    try:
        # We don't need a manual context wrapper here, as @jwt_required() should 
        # manage the request context automatically. The crash is happening because 
        # SQLAlchemy is breaking the context. Let's remove the context wrapper 
        # and trust the default JWT behavior.
        
        # If the code reaches here, the request context IS active.
        
        # 1. Get user ID and data
        user_id_str = get_jwt_identity() # Should work now if JWT setup is standard
        user_id = int(user_id_str)
        
        data = request.get_json()
        old_password = data.get('old_password')
        new_password = data.get('new_password')

        if not all([old_password, new_password]):
            return jsonify(msg="Missing password fields."), 400

        user = User.query.get(user_id)
        if not user:
            return jsonify(msg="User session invalid."), 401

        # 2. Verify Old Password (Security Check)
        if not user.password or not bcrypt.checkpw(old_password.encode('utf-8'), user.password.encode('utf-8')):
            return jsonify(msg="Invalid current password."), 403

        # 3. Hash and save the new password
        hashed_pw = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
        
        user.password = hashed_pw.decode('utf-8')
        db.session.commit()
        
        return jsonify({
            "status": "success", 
            "message": "Password updated successfully."
        }), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        # Ensure we return a 500 error if the commit failed
        return jsonify({"status": "error", "message": "Internal error during password update."}), 500
    
# -- Create and Delete User Endpoints ---
# --- Create User Endpoint ---
@user_routes.route('/users', methods=['POST'])
@admin_required
def create_new_user():
    """
    Handles adding a new user account (Admin only).
    The frontend sends: firstname, lastname, username, role, password.
    """
    try:
        # Use app context manually for stability
        from flask import current_app
        with current_app.app_context():
            data = request.get_json()

            # 1. Basic validation
            required_fields = ['firstname', 'lastname', 'username', 'role', 'password']
            if not all(field in data for field in required_fields):
                return jsonify(msg="Missing required user fields."), 400

            # 2. Check if username already exists
            if User.query.filter_by(username=data['username']).first():
                return jsonify(msg="Username already exists."), 409

            # 3. Hash the password before saving
            hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())

            # 4. Find the Role ID based on the role name (e.g., 'Admin' -> 1)
            role = Role.query.filter_by(role_name=data['role']).first()
            if not role:
                return jsonify(msg=f"Role '{data['role']}' not found in database."), 404

            # 5. Create and save the new User object
            new_user = User(
                firstname=data['firstname'],
                lastname=data['lastname'],
                username=data['username'],
                password=hashed_password.decode('utf-8'), # Store as string
                role_id=role.id
            )
            db.session.add(new_user)
            db.session.commit()

            return jsonify({'status': 'success', 'message': 'User created successfully!'}), 201

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': 'Failed to create user due to a server error.'}), 500
    
# --- Delete User Endpoint ---

@user_routes.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user_by_id(user_id):
    try:
        from flask import current_app
        from models import EventLog # <-- Ensure this import is at the top/accessible
        
        with current_app.app_context(): 
            
            current_admin_id = int(get_jwt_identity()) 
            user_to_delete = User.query.get(user_id)
            
            if not user_to_delete:
                return jsonify(msg="User not found."), 404
            if user_id == current_admin_id:
                return jsonify(msg="Cannot delete your own active account."), 403

            # 🛑 KEEP THIS AS FAILSAFE: Manually set FK to NULL
            EventLog.query.filter_by(ack_by_user_id=user_id).update(
                {'ack_by_user_id': None}, synchronize_session='fetch'
            )
            
            db.session.delete(user_to_delete)
            db.session.commit()

            return jsonify({'status': 'success', 'message': f'User {user_id} deleted successfully.'}), 200

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'status': 'error', 'message': f'Failed to delete user {user_id}.'}), 500