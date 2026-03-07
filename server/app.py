import asyncio
import os
import datetime
import jwt
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, send_from_directory, jsonify, g, make_response
from flask.json.provider import DefaultJSONProvider

# Database Instance
from database import db

# 1. Initialization
# NOTE: dotenv is not required; rely on system environment variables if present.
app = Flask(__name__, static_folder='../client/dist', static_url_path='/')

# Custom JSON Provider for BigInt support
class BigIntProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, int):
            return str(obj)
        return super().default(obj)

app.json = BigIntProvider(app)

# Basic CORS handling (no flask-cors dependency required)
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    return response

@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    return make_response('', 204)

# JWT helpers (uses PyJWT which is available in this environment)
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

async def ensure_db_connected():
    if not db.is_connected():
        await db.connect()

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
@app.route('/api/seed_db')
def seed_db():
    # In 'threading' mode, asyncio.run() works perfectly without crashes!
    return asyncio.run(run_seed())

async def run_seed():
    try:
        if not db.is_connected():
            await db.connect()
            
        user = await db.user.find_unique(where={'username': 'reginedahan'})
        if not user:
            await db.user.create(data={
                'firstname': "Regine",
                'lastname': "Dahan",
                'username': "reginedahan",
                'password': generate_password_hash("agapai321")
            })
            return "User created!"
        return "Already seeded."
    except Exception as e:
        print(f"Seed Error: {e}")
        return str(e), 500

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

# --- 5. LAUNCH ---
if __name__ == '__main__':
    # Run the Flask app; database connections are created per request when needed.
    app.run(host='0.0.0.0', port=5000, debug=True)
