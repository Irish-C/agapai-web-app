import asyncio
import os
import datetime
import jwt
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, send_from_directory, jsonify, g, make_response
from flask.json.provider import DefaultJSONProvider
from flask_socketio import SocketIO
from seed_db import seed_database

# Database Instance
from database import db

# 1. Initialization
app = Flask(__name__, static_folder='../client/dist', static_url_path='/')

# Initialize SocketIO AFTER 'app' is defined
socketio = SocketIO(app, cors_allowed_origins="*")

# Custom JSON Provider for BigInt support
class BigIntProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, int):
            return str(obj)
        return super().default(obj)

app.json = BigIntProvider(app)

# Basic CORS handling
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return make_response('', 204)

# JWT helpers
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')

def create_token(user_id):
    payload = {
        'sub': str(user_id),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=12)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

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

@app.before_request
def ensure_connection():
    # Use asyncio.run because Flask routes are synchronous 
    # but the prisma-python client is asynchronous
    if not db.is_connected():
        asyncio.run(db.connect())

# --- 3. BLUEPRINTS ---
from src.routes.user_routes import user_routes
from src.routes.camera_routes import camera_routes
from src.routes.settings_routes import settings_routes
from src.routes.event_routes import event_routes

app.register_blueprint(user_routes, url_prefix='/api')
app.register_blueprint(camera_routes, url_prefix='/api')
app.register_blueprint(settings_routes, url_prefix='/api')
app.register_blueprint(event_routes, url_prefix='/api')

# --- 4. SEED ROUTE (Pure Async) ---
@app.route('/api/seed_db', methods=['GET', 'POST'])
def seed_db():
    return jsonify(asyncio.run(seed_database()))

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# --- 5. LAUNCH ---
if __name__ == '__main__':
    # Use socketio.run instead of app.run to support WebSockets
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)