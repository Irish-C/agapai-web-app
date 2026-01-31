from prisma import Prisma
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token
from flask import jsonify
from database import db

async def login_logic(data):
    if not db.is_connected(): 
        await db.connect()
    
    user = await db.user.find_unique(where={'username': data.get('username')})
    
    if user and check_password_hash(user.password, data.get('password')):
        token = create_access_token(identity=str(user.id))
        return jsonify({"status": "success", "access_token": token}), 200 # Wrapped!
        
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401 # Wrapped!

async def get_profile_logic(user_id):
    if not db.is_connected():
        await db.connect()

    user = await db.user.find_unique(where={'id': int(user_id)})
    
    if not user:
        return jsonify({"error": "User not found"}), 404 
    
    return jsonify({
        "firstname": user.firstname or 'N/A',
        "lastname": user.lastname or 'User',
        "username": user.username
    }), 200

async def create_user_logic(data):
    if not db.is_connected():
        await db.connect()

    existing_user = await db.user.find_unique(where={'username': data['username']})
    if existing_user:
        return jsonify({"error": "Username already exists"}), 409

    hashed_pw = generate_password_hash(data['password'])
    
    new_user = await db.user.create(
        data={
            'firstname': data.get('firstname'),
            'lastname': data.get('lastname'),
            'username': data['username'],
            'password': hashed_pw,
        }
    )
    
    return jsonify({"status": "success", "message": "User created"}), 201