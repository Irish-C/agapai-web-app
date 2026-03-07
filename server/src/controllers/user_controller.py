from database import db
from werkzeug.security import check_password_hash, generate_password_hash
# Import your token creator from app.py or a dedicated auth util
# from app import create_token 

async def login_logic(data):
    # No manual db.connect() here; handled by app lifecycle
    user = await db.user.find_unique(where={'username': data.get('username')})
    if user and check_password_hash(user.password, data.get('password')):
        return {"status": "success", "user_id": user.id, "username": user.username}, 200
    return {"status": "error", "message": "Invalid credentials"}, 401

async def get_profile_logic(user_id):
    user = await db.user.find_unique(where={'id': int(user_id)})
    if not user:
        return {"error": "User not found"}, 404
    return {
        "firstname": user.firstname or 'N/A',
        "lastname": user.lastname or 'User',
        "username": user.username
    }, 200

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