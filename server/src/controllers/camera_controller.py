import os
import time
import uuid
from database import db

# Minimal camera controller without streaming or model code.
# Provides basic CRUD logic used by camera routes. Streaming and MediaMTX
# management have been intentionally removed to start from scratch.

SNAPSHOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../static/snapshots'))
os.makedirs(SNAPSHOT_DIR, exist_ok=True)

async def get_cameras_logic():
    cameras = await db.camera.find_many(include={"location": True})
    result = []
    from src.services.mediamtx_controller import MEDIAMTX_INGEST, MEDIAMTX_API
    for cam in cameras:
        # Hide archived cameras from management lists.
        if (cam.cam_name or '').startswith('[DELETED] '):
            continue

        cam_id = str(cam.id)
        # Construct playback URLs for MediaMTX: HLS and WebRTC (WHEP)
        try:
            # Use original stream by default (raw feed without AI processing)
            # When AI script is running, it will push processed video to processed/cam{id}
            playback_path = f"original/cam{cam_id}"
            # HLS endpoint (working and reliable)
            hls_url = f"http://127.0.0.1:8888/{playback_path}/index.m3u8"
            from src.services.mediamtx_controller import MEDIAMTX_WHEP
            # WHEP URL - note: no trailing slash as MediaMTX WHEP expects it without
            playback_webrtc = f"{MEDIAMTX_WHEP.rstrip('/')}/whep/play/{playback_path}"
        except Exception:
            hls_url = None
            playback_webrtc = None

        result.append({
            "id": cam_id,
            "name": cam.cam_name,
            "status": cam.cam_status,
            "stream_url": cam.stream_url,
            "playback_url": hls_url,
            "playback_webrtc": playback_webrtc,
            "location_name": cam.location.loc_name if cam.location else None,
        })
    return result, 200

async def get_camera_logic(camera_id):
    camera = await db.camera.find_unique(
        where={"id": int(camera_id)},
        include={"location": True}
    )
    if not camera:
        return {"error": "Camera not found"}, 404
    cam_id = str(camera.id)
    return {
        "id": cam_id,
        "name": camera.cam_name,
        "location_name": camera.location.loc_name if camera.location else None,
    }, 200

async def create_camera_logic(camera_data):
    try:
        data_payload = {
            "cam_name": camera_data.get("cam_name"),
            "loc_id": int(camera_data.get("loc_id")),
            "stream_url": camera_data.get("stream_url"),
            "cam_status": True
        }

        new_camera = await db.camera.create(data=data_payload)
        return {"status": "success", "camera_id": str(new_camera.id)}, 201
    except Exception as e:
        return {"error": str(e)}, 500

async def update_camera_logic(camera_id, camera_data):
    try:
        cam_name = camera_data.get("cam_name")
        loc_id = camera_data.get("loc_id")
        stream_url = camera_data.get("stream_url")
        if loc_id is None:
            return {"error": "loc_id is required and cannot be None"}, 400
        update_payload = {
            "cam_name": cam_name,
            "loc_id": int(loc_id),
            "stream_url": stream_url
        }

        updated_camera = await db.camera.update(
            where={"id": int(camera_id)},
            data=update_payload
        )

        return {"status": "success", "camera_id": str(updated_camera.id)}, 200
    except Exception as e:
        return {"error": str(e)}, 500

async def delete_camera_logic(camera_id):
    try:
        camera = await db.camera.find_unique(where={"id": int(camera_id)})
        if not camera:
            return {"error": "Camera not found"}, 404

        # Archive instead of hard delete so incident history keeps camera linkage.
        archived_name = camera.cam_name
        if not (camera.cam_name or '').startswith('[DELETED] '):
            archived_name = f"[DELETED] {camera.cam_name}"

        await db.camera.update(
            where={"id": int(camera_id)},
            data={
                "cam_name": archived_name,
                "cam_status": False,
                "stream_url": f"deleted://camera/{int(camera_id)}"
            }
        )

        return {"status": "success", "message": "Camera archived."}, 200
    except Exception as e:
        return {"error": str(e)}, 500

# Stubs for MediaMTX actions (disabled)
async def publish_camera_to_mediamtx(camera_id):
    from src.services.mediamtx_controller import start_relay, start_processed_push
    import os, shlex

    try:
        camera = await db.camera.find_unique(where={"id": int(camera_id)})
        if not camera:
            return {"error": "Camera not found"}, 404
        original_rtsp = camera.stream_url
        if not original_rtsp:
            return {"error": "Camera has no stream_url"}, 400

        # Decide mode based on global AI flag
        try:
            gs = await db.globalsetting.find_first()
            ai_enabled = True if not gs else bool(getattr(gs, 'ai_enabled', True))
        except Exception:
            ai_enabled = True

        target_path = f"processed/cam{camera_id}" if ai_enabled else f"original/cam{camera_id}"

        # Build full target URL for MediaMTX ingest
        from src.services.mediamtx_controller import MEDIAMTX_INGEST
        full_target = f"{MEDIAMTX_INGEST.rstrip('/')}/{target_path.lstrip('/')}"

        server_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
        worker_py = os.path.join(server_root, 'src', 'workers', 'processing_worker.py')

        if ai_enabled:
            # spawn processing worker which handles inference + ffmpeg push
            cmd = f"python3 {shlex.quote(worker_py)} --src {shlex.quote(original_rtsp)} --target {shlex.quote(full_target)} --camera_id {int(camera_id)}"
            info = start_processed_push(cmd, camera_id)
            return {"status": "success", "mode": "processed", "worker": info}, 200
        else:
            # start a simple relay without AI
            info = start_relay(original_rtsp, target_path, camera_id)
            return {"status": "success", "mode": "relay", "worker": info}, 200
    except Exception as e:
        return {"error": str(e)}, 500

async def unpublish_camera_from_mediamtx(camera_id):
    from src.services.mediamtx_controller import stop_worker
    try:
        ok = stop_worker(camera_id)
        if ok:
            return {"status": "success", "message": "Unpublished and worker stopped"}, 200
        else:
            return {"status": "success", "message": "No worker found; cleaned state"}, 200
    except Exception as e:
        return {"error": str(e)}, 500
