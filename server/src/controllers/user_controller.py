from database import db
from werkzeug.security import check_password_hash, generate_password_hash
from src.utils.role_utils import normalize_role

async def login_logic(data):
    # Fetch user AND the associated role record
    user = await db.user.find_unique(
        where={'username': data.get('username')},
        include={'role': True}
    )
    
    if user and check_password_hash(user.password, data.get('password')):
        return {
            "status": "success", 
            "user_id": str(user.id), # BigInt string conversion
            "username": user.username,
            # Normalize so 'Admin' becomes 'admin' for the frontend
            "role": normalize_role(user.role.role_name) if user.role else "caregiver",
        }, 200
        
    return {"status": "error", "message": "Invalid credentials"}, 401

async def list_users_logic():
    # Include role here too for the Management table
    users = await db.user.find_many(include={'role': True})
    result = []
    for user in users:
        result.append({
            'id': str(user.id),
            'firstname': user.firstname,
            'lastname': user.lastname,
            'username': user.username,
            'role': normalize_role(user.role.role_name) if user.role else None,
            'email_notifications': user.email_notifications,
            'alert_threshold': user.alert_threshold,
        })
    return result, 200
async def get_profile_logic(user_id):
    user = await db.user.find_unique(
        where={'id': int(user_id)},
        include={'role': True}
    )
    if not user:
        return {"error": "User not found"}, 404
    
    return {
        "firstname": user.firstname or 'N/A',
        "lastname": user.lastname or 'User',
        "username": user.username,
        "role": user.role.role_name if user.role else 'user'
    }, 200
    
async def update_user_logic(user_id, data):
    try:
        update_data = {}
        # Ensure indentation is exactly 8 spaces inside the 'if' blocks
        if 'firstname' in data:
            update_data['firstname'] = data['firstname']
        if 'lastname' in data:
            update_data['lastname'] = data['lastname']
        if 'username' in data:
            update_data['username'] = data['username']

        if 'role' in data and isinstance(data['role'], str):
            role_record = await db.role.find_unique(where={'role_name': normalize_role(data['role'])})
            if role_record:
                update_data['role_id'] = role_record.id
        elif 'role_id' in data:
            update_data['role_id'] = int(data['role_id'])

        if not update_data:
            return {"status": "error", "message": "No update fields provided."}, 400

        await db.user.update(
            where={'id': int(user_id)},
            data=update_data
        )
        return {"status": "success", "message": "User updated"}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500
        
async def archive_user_logic(user_id):
    try:
        # We do not currently have an is_active field in the schema, so archiving deletes the user.
        await db.user.delete(where={'id': int(user_id)})
        return {"status": "success", "message": "User archived"}, 200
    except Exception as e:
        return {"status": "error", "message": str(e)}, 500

async def change_password_logic(user_id, old_password, new_password):
    user = await db.user.find_unique(where={'id': int(user_id)})
    if not user:
        return {"status": "error", "message": "User not found"}, 404

    if not check_password_hash(user.password, old_password):
        return {"status": "error", "message": "Old password incorrect"}, 401

    hashed_pw = generate_password_hash(new_password)
    await db.user.update(
        where={'id': int(user_id)},
        data={'password': hashed_pw}
    )
    return {"status": "success", "message": "Password updated"}, 200

async def create_user_logic(data):
    existing_user = await db.user.find_unique(where={'username': data['username']})
    if existing_user:
        return {"error": "Username already exists"}, 409
    
    hashed_pw = generate_password_hash(data['password'])
    new_user = await db.user.create(
        data={
            'firstname': data.get('firstname'),
            'lastname': data.get('lastname'),
            'username': data['username'],
            'password': hashed_pw,
        }
    )
    return {"status": "success", "message": "User created"}, 201