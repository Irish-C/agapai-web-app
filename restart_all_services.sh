#!/bin/bash

echo "🔴 Step 1: Killing all old processes..."
pkill -9 -f "processing_worker"
pkill -9 -f "ffmpeg.*cam"
pkill -9 -f "mediamtx"
sleep 2

echo "🟡 Step 2: Starting MediaMTX..."
cd /home/agapai/agapai-web-app/server
./mediamtx mediamtx.yml &
MEDIAMTX_PID=$!
sleep 3

echo "🟡 Step 3: Starting Backend Server..."
DEVICE=GPU OPENVINO_DEVICE=HETERO:GPU,CPU ./venv/bin/python -m uvicorn app:asgi_app --reload --port 5000 &
SERVER_PID=$!
sleep 3

echo "✅ Services started:"
echo "   - MediaMTX (PID: $MEDIAMTX_PID) - HLS on http://127.0.0.1:8888"
echo "   - Backend Server (PID: $SERVER_PID) - API on http://127.0.0.1:5000"
echo ""
echo "📝 Next steps:"
echo "   1. Go to http://localhost:5173/dashboard"
echo "   2. Click PUBLISH for Camera 1"
echo "   3. Wait 5 seconds"
echo "   4. Refresh page"
echo "   5. Video stream should appear!"
echo ""
echo "🔍 To debug, run:"
echo "   tail -50 /tmp/processing_worker_cam1.log"
echo "   tail -50 /tmp/server.log"
