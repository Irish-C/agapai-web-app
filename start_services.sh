#!/bin/bash
# Quick start script for AGAPAI streaming services

set -e

CONFIG_DIR="/home/agapai/agapai-web-app"
SERVER_DIR="$CONFIG_DIR/server"
CLIENT_DIR="$CONFIG_DIR/client"

echo "================================"
echo "AGAPAI System Startup"
echo "================================"

# Kill any existing processes
echo "[1/4] Cleaning up existing processes..."
pkill -f mediamtx || true
pkill -f "python.*app.py" || true
sleep 2

# Start MediaMTX
echo "[2/4] Starting MediaMTX (streaming server)..."
cd "$SERVER_DIR"
if [ ! -f "mediamtx" ]; then
    echo "❌ Error: mediamtx binary not found at $SERVER_DIR/mediamtx"
    exit 1
fi
./mediamtx mediamtx.yml > mediamtx.log 2>&1 &
MEDIAMTX_PID=$!
echo "✓ MediaMTX started (PID: $MEDIAMTX_PID)"
sleep 2

# Verify MediaMTX is running
if ! ps -p $MEDIAMTX_PID > /dev/null; then
    echo "❌ MediaMTX failed to start"
    cat "$SERVER_DIR/mediamtx.log"
    exit 1
fi

# Verify MediaMTX ports
echo "[3/4] Verifying MediaMTX connectivity..."
if ss -tlnp 2>/dev/null | grep -q ":8889"; then
    echo "✓ WebRTC/WHEP listening on :8889"
else
    echo "⚠ Warning: WebRTC/WHEP not listening on :8889"
fi

if ss -tlnp 2>/dev/null | grep -q ":8554"; then
    echo "✓ RTSP ingest listening on :8554"
else
    echo "⚠ Warning: RTSP ingest not listening on :8554"
fi

if ss -tlnp 2>/dev/null | grep -q ":9997"; then
    echo "✓ API listening on :9997"
else
    echo "⚠ Warning: API not listening on :9997"
fi

echo ""
echo "[4/4] Services ready!"
echo "================================"
echo "📊 Dashboard: http://localhost:5173"
echo "📹 MediaMTX API: http://127.0.0.1:9997"
echo "🎬 WebRTC/WHEP: http://127.0.0.1:8889"
echo "📖 Streaming Guide: $CONFIG_DIR/STREAMING_SETUP.md"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Open http://localhost:5173 in browser"
echo "2. Login to dashboard"
echo "3. Go to Settings → Device and Location"
echo "4. Add camera with RTSP URL"
echo "5. Click 'Publish' button to start streaming"
echo "6. View stream in Dashboard → Live View"
echo ""
