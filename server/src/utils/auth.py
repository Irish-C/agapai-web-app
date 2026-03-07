import os
import jwt
from flask import request

SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')


def get_token_user_id():
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            return payload.get('sub')
        except Exception:
            return None
    return None
