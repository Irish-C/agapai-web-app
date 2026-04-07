import os
import asyncio
import json
import redis.asyncio as aioredis
from src.services.socket_manager import socketio_server

REDIS_URL = os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')


async def _run_consumer(stop_event: asyncio.Event):
    redis = aioredis.from_url(REDIS_URL, decode_responses=False)
    pubsub = redis.pubsub()
    pattern = 'camera:*:detections'
    await pubsub.psubscribe(pattern)
    print(f"[redis_consumer] Subscribed to pattern: {pattern}")

    try:
        async for msg in pubsub.listen():
            if stop_event.is_set():
                break
            if msg is None:
                continue
            mtype = msg.get('type')
            # pmessage events include the pattern and channel
            if mtype not in ('pmessage', 'message'):
                continue
            data = msg.get('data')
            if data is None:
                continue
            try:
                if isinstance(data, (bytes, bytearray)):
                    text = data.decode('utf-8')
                else:
                    text = str(data)
                event = json.loads(text)
            except Exception:
                # ignore malformed messages
                continue

            camera_id = event.get('camera_id') or event.get('camera') or 'unknown'
            room = f"camera_{camera_id}"
            try:
                # Emit detection event to clients in the camera room
                await socketio_server.emit('detection', event, room=room)
            except Exception as e:
                print(f"[redis_consumer] Failed to emit to Socket.IO: {e}")
    except asyncio.CancelledError:
        pass
    finally:
        try:
            await pubsub.punsubscribe(pattern)
        except Exception:
            pass
        try:
            await redis.close()
        except Exception:
            pass


_consumer_task = None
_stop_event = None


def start_in_background(loop=None):
    global _consumer_task, _stop_event
    if _consumer_task is not None:
        return _consumer_task
    if loop is None:
        loop = asyncio.get_event_loop()
    _stop_event = asyncio.Event()
    _consumer_task = loop.create_task(_run_consumer(_stop_event))
    return _consumer_task


async def stop():
    global _consumer_task, _stop_event
    if _stop_event is not None:
        _stop_event.set()
    if _consumer_task is not None:
        _consumer_task.cancel()
        try:
            await _consumer_task
        except Exception:
            pass
    _consumer_task = None
    _stop_event = None
