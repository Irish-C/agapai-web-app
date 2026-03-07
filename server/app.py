import asyncio
import os
import jwt
from datetime import datetime, timezone, timedelta
from functools import wraps
from dotenv import load_dotenv

from flask import Flask, request, send_from_directory, jsonify, g, make_response
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from flask_socketio import SocketIO
# Use Middleware to wrap for ASGI/Hypercorn
from engineio.middleware import Middleware as ASGIMiddleware

from database import db
from seed_db import seed_database

# 1. LOAD ENVIRONMENT
load_dotenv()
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')

# 2. APP INITIALIZATION
app = Flask(__name__, static_folder='../client/dist', static_url_path='/')

# Create a single Socket.IO instance and wrap it for ASGI.
# Use the default async_mode (threading) so Socket.IO works under Hypercorn.
# Avoid passing unsupported values like 'asgi' which Engine.IO does not recognize.
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    logger=True,
    engineio_logger=True
)

# Wrap the SocketIO instance with Engine.IO ASGI middleware.
# This makes the Flask app + Socket.IO work when served by an ASGI server.
asgi_app = ASGIMiddleware(socketio.server, app)

# --- 2. FLASK-CORS SETTINGS (HTTP API) ---
CORS(app, resources={r"/api/*": {
    "origins": ["http://127.0.0.1:5173", "http://localhost:5173"],
    "methods": ["GET", "POST", "OPTIONS", "PATCH", "DELETE"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# BigInt Support for Prisma
class BigIntProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, int):
            return str(obj)
        return super().default(obj)

app.json = BigIntProvider(app)

# 4. AUTH HELPERS
def create_token(user_id):
    payload = {
        'sub': str(user_id),
        'iat': datetime.now(timezone.utc),
        'exp': datetime.now(timezone.utc) + timedelta(hours=12)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'status': 'error', 'message': 'Token is missing.'}), 401
        
        token = auth_header.split(' ', 1)[1].strip()
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            g.user_id = payload.get('sub')
        except jwt.ExpiredSignatureError:
            return jsonify({'status': 'error', 'message': 'Token has expired.'}), 401
        except Exception:
            return jsonify({'status': 'error', 'message': 'Invalid token.'}), 401
        return f(*args, **kwargs)
    return decorated

# 5. BLUEPRINTS
from src.routes.user_routes import user_routes
from src.routes.camera_routes import camera_routes
from src.routes.event_routes import event_routes
app.register_blueprint(user_routes, url_prefix='/api')
app.register_blueprint(camera_routes, url_prefix='/api')
app.register_blueprint(event_routes, url_prefix='/api')

# 6. DB LIFECYCLE
@app.before_request
async def ensure_db_connected():
    if not db.is_connected():
        await db.connect()

# 7. UTILITY ROUTES
@app.route('/api/seed_db', methods=['POST'])
async def seed_db_route():
    try:
        await seed_database()
        return jsonify({"status": "success", "message": "Database seeded"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    # Use this ONLY for 'python app.py'
    async def run_dev():
        if not db.is_connected():
            await db.connect()
        try:
            socketio.run(app, host='127.0.0.1', port=5000, debug=True, use_reloader=False, allow_unsafe_werkzeug=True)
        finally:
            if db.is_connected():
                await db.disconnect()

    asyncio.run(run_dev())