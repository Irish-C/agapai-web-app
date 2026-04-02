"""
Socket.IO server manager.

Centralizes Socket.IO server initialization, event handlers, and connection tracking.
This prevents circular imports and keeps the main app.py clean.
"""

import socketio
from src.utils.redis_pool import RedisConnectionPool
from src.utils.auth import get_token_user_id_from_header

# --- Socket.IO Server Instance ---
socketio_server = socketio.AsyncServer(
    async_mode='asgi',
    # For development allow all origins (tighten in production)
    cors_allowed_origins='*',
    # Longer heartbeat for polling transport (dev uses polling which is slower)
    ping_interval=15,
    ping_timeout=35,
    # Enable logging to help trace disconnects during debugging
    # Disable per-emit debug logging to avoid console spam when streaming
    logger=False,
    engineio_logger=False,
)

# Track currently connected Socket.IO session ids. Other modules may import
# this set and avoid emitting frames when there are no connected clients.
connected_sids: set = set()


# --- Socket.IO Event Handlers ---
@socketio_server.event
async def connect(sid, environ):
    """Handle new Socket.IO client connection."""
    addr = environ.get('REMOTE_ADDR') if environ else None
    print(f"Socket.IO connect: sid={sid}, addr={addr}")
    connected_sids.add(sid)


@socketio_server.event
async def disconnect(sid):
    """Handle Socket.IO client disconnection."""
    print(f"Socket.IO disconnect: sid={sid}")
    try:
        connected_sids.discard(sid)
    except Exception:
        pass


@socketio_server.on('subscribe_camera')
async def subscribe_camera(sid, data):
    """Allow clients to subscribe to specific camera rooms.
    
    This enables frame emission only to viewers of that camera instead of
    broadcasting globally. Also sets the active camera for AI processing.
    """
    try:
        token = None
        if isinstance(data, dict):
            token = data.get('token')

        user_id = None
        if token:
            user_id = get_token_user_id_from_header(f"Bearer {token}")

        if not user_id:
            environ = socketio_server.get_environ(sid)
            if environ:
                user_id = get_token_user_id_from_header(environ.get('HTTP_AUTHORIZATION'))

        if not user_id:
            await socketio_server.emit('auth_error', {'message': 'Authentication required'}, to=sid)
            return

        camera_id = None
        if isinstance(data, dict):
            camera_id = data.get('camera_id') or data.get('cam_id')
        else:
            camera_id = data
        if camera_id is None:
            return
        room = f"camera_{camera_id}"
        socketio_server.enter_room(sid, room)
        
        # Set as active camera for AI processing
        r = RedisConnectionPool.get()
        r.set('active_camera_id', str(camera_id))
        
        print(f"Socket.IO subscribe: sid={sid} -> {room} (AI focus set)")
    except Exception as e:
        print(f"subscribe_camera error: {e}")


@socketio_server.on('unsubscribe_camera')
async def unsubscribe_camera(sid, data):
    """Allow clients to unsubscribe from specific camera rooms."""
    try:
        token = None
        if isinstance(data, dict):
            token = data.get('token')

        user_id = None
        if token:
            user_id = get_token_user_id_from_header(f"Bearer {token}")

        if not user_id:
            environ = socketio_server.get_environ(sid)
            if environ:
                user_id = get_token_user_id_from_header(environ.get('HTTP_AUTHORIZATION'))

        if not user_id:
            await socketio_server.emit('auth_error', {'message': 'Authentication required'}, to=sid)
            return

        camera_id = None
        if isinstance(data, dict):
            camera_id = data.get('camera_id') or data.get('cam_id')
        else:
            camera_id = data
        if camera_id is None:
            return
        room = f"camera_{camera_id}"
        socketio_server.enter_room(sid, room)
        print(f"Socket.IO unsubscribe: sid={sid} -> {room}")
    except Exception as e:
        print(f"unsubscribe_camera error: {e}")


@socketio_server.on('ping')
async def handle_ping(sid, data):
    """Health check handler: client sends ping, server responds with pong."""
    try:
        timestamp = data.get('timestamp') if isinstance(data, dict) else None
        await socketio_server.emit('pong', {'timestamp': timestamp}, to=sid)
        # Uncomment for verbose health check logs
        # print(f"SocketIO health check: ping from {sid}, pong sent")
    except Exception as e:
        print(f"SocketIO health check error: {e}")
