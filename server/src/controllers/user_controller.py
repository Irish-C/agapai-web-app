import os
import datetime
import jwt
from prisma import Prisma
from werkzeug.security import check_password_hash, generate_password_hash
from database import db

# Secret used for JWT encoding/decoding. Keep in sync with app.py.
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')

def create_token(user_id):
    payload = {
        'sub': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


async def login_logic(data):
    if not db.is_connected():
        await db.connect()

    user = await db.user.find_unique(where={'username': data.get('username')})

    if user and check_password_hash(user.password, data.get('password')):
        token = create_token(user.id)
        return {"status": "success", "access_token": token}, 200

    return {"status": "error", "message": "Invalid credentials"}, 401

async def get_profile_logic(user_id):
    if not db.is_connected():
        await db.connect()

    user = await db.user.find_unique(where={'id': int(user_id)})

    if not user:
        return {"error": "User not found"}, 404

    return {
        "firstname": user.firstname or 'N/A',
        "lastname": user.lastname or 'User',
        "username": user.username
    }, 200

async def create_user_logic(data):
    if not db.is_connected():
        await db.connect()

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