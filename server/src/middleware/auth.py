import os
import datetime
import jwt
from functools import wraps
from flask import request, jsonify, g

SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1].strip()

        if not token:
            return jsonify({'status': 'error', 'message': 'Token is missing.'}), 401

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            g.user_id = payload.get('sub')
        except jwt.ExpiredSignatureError:
            return jsonify({'status': 'error', 'message': 'Token has expired.'}), 401
        except Exception:
            return jsonify({'status': 'error', 'message': 'Invalid token.'}), 401

        return f(*args, **kwargs)
    return decorated

def create_token(user_id):
    payload = {
        'sub': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')