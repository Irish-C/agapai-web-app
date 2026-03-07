from functools import wraps
from flask import Blueprint, request, jsonify, g
from database import db

user_routes = Blueprint('user_routes', __name__)

# Role hierarchy
ROLE_PERMISSIONS = {
    "admin": ["read", "write", "delete", "manage_users"],
    "supervisor": ["read", "write", "manage_events"],
    "houseparent": ["read", "write_notes"],
}
def role_required(*allowed_roles):
    """Decorator to check user roles"""
    def decorator(f):
        @wraps(f)
        async def decorated_function(*args, **kwargs):
            user_id = g.get('user_id')
            if not user_id:
                return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
            
            user = await db.user.find_unique(where={'id': int(user_id)}, include={'role': True})
            if not user or not user.role:
                return jsonify({'status': 'error', 'message': 'User role not found'}), 403
            
            if user.role.role_name not in allowed_roles:
                return jsonify({'status': 'error', 'message': 'Insufficient permissions'}), 403
            
            g.user = user
            return await f(*args, **kwargs)
        return decorated_function
    return decorator

@user_routes.route('/users', methods=['GET'])
@token_required
@role_required('admin', 'supervisor')
async def get_users():
    """Only admin and supervisor can view users"""
    users = await db.user.find_many(include={'role': True})
    return jsonify({
        'status': 'success',
        'users': [{'id': u.id, 'username': u.username, 'role': u.role.role_name} for u in users]
    })