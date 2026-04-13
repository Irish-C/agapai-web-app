import os
import subprocess
import shlex
import time
from src.utils.redis_pool import RedisConnectionPool

# Read MediaMTX ingest and API host from env. MediaMTX RTSP is on port 8554, API on 9997
MEDIAMTX_INGEST = os.getenv('MEDIAMTX_URL', 'rtsp://127.0.0.1:8554')
MEDIAMTX_API = os.getenv('MEDIAMTX_API', 'http://127.0.0.1:9997')

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
    
    # Open log file for relay output
    log_path = f"/tmp/relay_cam{camera_id}.log"
    try:
        log_file = open(log_path, 'w')
    except Exception as e:
        print(f"[mediamtx_controller] Failed to open log file {log_path}: {e}")
        log_file = subprocess.DEVNULL
    
    print(f"[mediamtx_controller] Starting relay for camera {camera_id}")
    print(f"[mediamtx_controller] Command: {cmd}")
    
    try:
        proc = subprocess.Popen(
            shlex.split(cmd), 
            stdout=log_file,
            stderr=subprocess.STDOUT
        )
        
        # Give process a moment to start and check if it's still alive
        time.sleep(0.5)
        poll_result = proc.poll()
        if poll_result is not None:
            print(f"[mediamtx_controller] ❌ Relay process exited immediately with code {poll_result}")
            if log_file != subprocess.DEVNULL:
                try:
                    with open(log_path, 'r') as f:
                        error_output = f.read()
                        if error_output:
                            print(f"[mediamtx_controller] Relay output: {error_output}")
                except Exception:
                    pass
        else:
            print(f"[mediamtx_controller] ✓ Relay process started (PID: {proc.pid})")
        
        info = {
            'pid': proc.pid,
            'cmd': cmd,
            'started_at': int(time.time() * 1000),
            'log_file': log_path,
        }
        try:
            r.set(_redis_key(camera_id), str(info))
        except Exception:
            pass
        return info
    except Exception as e:
        print(f"[mediamtx_controller] ❌ Failed to start relay: {e}")
        if log_file != subprocess.DEVNULL:
            try:
                log_file.close()
            except Exception:
                pass
        raise


