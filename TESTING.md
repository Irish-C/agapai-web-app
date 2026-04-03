# Manual UX Testing Checklist

Purpose
- Quick manual checklist for validating the client-side capture → server detection UX and basic test commands.

Prerequisites
- Backend and frontend running and accessible from the tester machine.
- A camera entry (camera id / stream URL) available in the UI.
- `camera_dev_mode` toggle accessible in the UI (or settable via `localStorage`).

Quick start (recommended)

- Start backend (Docker Compose):

```bash
# run from repo root
docker compose up --build
```

- Or start backend locally (example):

```bash
cd server
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-pruned.txt
# run with uvicorn if FastAPI app is defined as `app` in app.py
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

- Start frontend:

```bash
cd client
npm install
npm run dev
```

Test checklist

1) Open camera view
- Open the app in a browser and view a camera tile (focus it if needed).

2) Enable Dev/Test mode
- In the UI enable the dev toggle (or set `localStorage.setItem('camera_dev_mode','1')`) and refresh.

3) Overlay and snapshot checks
- Toggle the confidence threshold (dev UI) and confirm low-confidence detections disappear.
- Click the snapshot button (camera icon) and confirm a JPEG is downloaded (placeholder snapshot if streaming not enabled).

8) Single-inflight / throttling
- In dev mode, verify the client doesn't issue overlapping `/detect` requests: open browser devtools → Network and ensure at most one outstanding `/detect` request.

9) Staleness handling
- Stop detections on the server or pause the network and confirm overlays clear after ~2s (stale timeout).

10) Server logs & inference timing
- On backend console, verify per-request log lines like: `[detect] Inference time: XXms`.
- While running a detection, inspect server logs and confirm inference times are reasonable (tens to a few hundred ms depending on hardware).

11) Failure modes / graceful degradation
- Try disconnecting the camera media server or stopping the backend. Confirm the UI shows `Camera Offline` or `Camera Error` appropriately and recovers when services return.

Troubleshooting notes
- If overlays are consistently offset by a scale/translation, check whether the client is using the correct source dimensions reported in `X-Source-Width`/`X-Source-Height` headers.
- If no `/detect` responses appear, check network tab for 4xx/5xx responses and backend logs for payload rejection or rate-limit messages.

Where to look
- Client: `client/src/features/camera/VideoFeed.jsx` — capture, downscale, overlay rendering, snapshot.
- Server: `server/app.py` — `/detect` endpoint, inference timing logs.

Next steps (after manual tests)
- Record any reproducible UX issues and create issues/PRs to fix alignment, timing, or robustness problems.

Optional: automated smoke test (manual replay)
- Use `curl` to POST a sample JPEG to `/detect` and inspect returned JSON (normalized boxes 0..1):

```bash
curl -X POST --header "Content-Type: image/jpeg" --data-binary @sample.jpg "http://localhost:8000/detect" -v
```

Expected: JSON array/object with normalized `box: [nx,ny,nw,nh]`, `label`, and `confidence` fields.

---
Generated: TESTING checklist for quick manual QA of client→server detection UX.
