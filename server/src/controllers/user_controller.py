# server/controllers/user_controller.py
import bcrypt
from flask import jsonify
from flask_jwt_extended import create_access_token
from models import User, Role, EventLog
from database import db
from sqlalchemy.orm import joinedload

def login_logic(data):
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return {"error": "Missing username or password", "code": 400}

    user = User.query.filter_by(username=username).first()
    if user and user.password:
        if bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            access_token = create_access_token(identity=str(user.id))
            return {
                "status": "success",
                "user_id": user.id,
                "role": user.role.role_name if user.role else 'User',
                "access_token": access_token
            }, 200

    return {"error": "Invalid username or password", "code": 401}

def get_profile_logic(user_id):
    user = db.session.get(User, user_id, options=[joinedload(User.role)])
    if not user:
        return {"error": "User not found", "code": 404}
    
    return {
        "firstname": user.firstname or 'N/A',
        "lastname": user.lastname or 'User',
        "username": user.username,
        "role": user.role.role_name if user.role else 'User'
    }, 200

def create_user_logic(data):
    if User.query.filter_by(username=data['username']).first():
        return {"error": "Username already exists", "code": 409}

    role = Role.query.filter_by(role_name=data['role']).first()
    if not role:
        return {"error": "Role not found", "code": 404}

    hashed_pw = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    new_user = User(
        firstname=data['firstname'],
        lastname=data['lastname'],
        username=data['username'],
        password=hashed_pw.decode('utf-8'),
        role_id=role.id
    )
    db.session.add(new_user)
    db.session.commit()
    return {"status": "success", "message": "User created"}, 201