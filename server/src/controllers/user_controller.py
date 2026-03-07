from database import db
from werkzeug.security import check_password_hash, generate_password_hash
from src.utils.role_utils import normalize_role
from database import db

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
        update_data = {
            'firstname': data['firstname'],
            'lastname': data['lastname'],
        }

        # If role is provided, map it to ID
        if 'role' in data:
            role_record = await db.role.find_unique(where={'role_name': data['role']})
            if role_record:
                update_data['role_id'] = role_record.id

        # If a new password is provided, hash it
        if data.get('password'):
            update_data['password'] = hash_password(data['password'])

        await db.user.update(
            where={'id': int(user_id)},
            data=update_data
        )

        return {"status": "success", "message": "User updated successfully"}, 200
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
    try:
        # 1. Find the Role object by its name (e.g., 'caregiver')
        role_record = await db.role.find_unique(
            where={'role_name': data['role']}
        )

        if not role_record:
            return {"status": "error", "message": f"Role '{data['role']}' not found."}, 400

        # 2. Hash the password before saving
        hashed_pw = hash_password(data['password'])

        # 3. Create the user using the found role_id
        new_user = await db.user.create(
            data={
                'firstname': data['firstname'],
                'lastname': data['lastname'],
                'username': data['username'],
                'password': hashed_pw,
                'role_id': role_record.id # Linking via the ID from the DB
            }
        )

        return {
            "status": "success", 
            "message": "User created successfully",
            "user_id": str(new_user.id)
        }, 201

    except Exception as e:
        print(f"Error creating user: {e}")
        return {"status": "error", "message": str(e)}, 500