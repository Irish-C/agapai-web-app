import os
import subprocess
import shlex
import time
from src.utils.redis_pool import RedisConnectionPool

# Read MediaMTX ingest and API host from env. Default to port 8888 as requested.
MEDIAMTX_INGEST = os.getenv('MEDIAMTX_URL', 'rtsp://127.0.0.1:8888')
MEDIAMTX_API = os.getenv('MEDIAMTX_API', 'http://127.0.0.1:8888')
MEDIAMTX_WHEP = os.getenv('MEDIAMTX_WHEP', 'http://127.0.0.1:8889')

def _redis_key(camera_id):
    return f"mediamtx:worker:{camera_id}"

def start_relay(original_rtsp, target_path, camera_id):
    """Start an ffmpeg process that relays original RTSP (no AI) into MediaMTX.

    Returns process info dict or raises on failure.
    """
    r = RedisConnectionPool.get()
    target = f"{MEDIAMTX_INGEST.rstrip('/')}/{target_path.lstrip('/')}"

    # Use copy codec for minimal CPU when relaying
    cmd = (
        f"ffmpeg -rtsp_transport tcp -i {shlex.quote(original_rtsp)} "
        f"-c copy -f rtsp {shlex.quote(target)}"
    )
    proc = subprocess.Popen(shlex.split(cmd), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    info = {
        'pid': proc.pid,
        'cmd': cmd,
        'started_at': int(time.time() * 1000),
    }
    try:
        r.set(_redis_key(camera_id), str(info))
    except Exception:
        pass
    return info

def start_processed_push(ffmpeg_cmd, camera_id):
    """Start a prepared ffmpeg command (for processed worker to push into mediamtx).
    `ffmpeg_cmd` is a shell command string.
    """
    r = RedisConnectionPool.get()
    proc = subprocess.Popen(shlex.split(ffmpeg_cmd), stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    info = {
        'pid': proc.pid,
        'cmd': ffmpeg_cmd,
        'started_at': int(time.time() * 1000),
    }
    try:
        r.set(_redis_key(camera_id), str(info))
    except Exception:
        pass
    return info

def stop_worker(camera_id):
    r = RedisConnectionPool.get()
    key = _redis_key(camera_id)
    try:
        val = r.get(key)
        if not val:
            return False
        # val is a string representation of dict; simple parse for pid
        s = val.decode() if isinstance(val, (bytes, bytearray)) else str(val)
        import re
        m = re.search(r"'pid':\s*(\d+)", s)
        if m:
            pid = int(m.group(1))
            try:
                os.kill(pid, 15)
            except Exception:
                pass
        r.delete(key)
        return True
    except Exception:
        return False
