#!/usr/bin/env bash
set -euo pipefail
# Wrapper script to continuously grab single frames from RTSP with ffmpeg and POST to /detect
# Reads configuration from an env file (default: sibling rtsp_ffmpeg.env).

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
ENV_FILE="${SCRIPT_DIR}/rtsp_ffmpeg.env"
if [ -n "${RTSP_ENV_FILE-}" ]; then
  ENV_FILE="$RTSP_ENV_FILE"
fi

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$ENV_FILE"
fi

: "${RTSP_URL:?RTSP_URL must be set in $ENV_FILE or environment}"
DETECT_URL="${DETECT_URL:-http://localhost:8000/detect}"
CAMERA_ID="${CAMERA_ID:-cam1}"
FPS="${FPS:-1}"
QUALITY="${QUALITY:-80}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
SLEEP_SECONDS="$(python3 - <<PY
import os
f=float(os.environ.get('FPS','1'))
print(max(0.1,1.0/f))
PY
)"

FFMPEG_OPTS=( -nostdin -hide_banner -loglevel error -rtsp_transport tcp -i "$RTSP_URL" -frames:v 1 -f image2pipe -vcodec mjpeg - )

if [ -n "$AUTH_TOKEN" ]; then
  AUTH_HEADER=( -H "Authorization: Bearer $AUTH_TOKEN" )
else
  AUTH_HEADER=()
fi

echo "[rtsp_ffmpeg_loop] starting: RTSP=$RTSP_URL -> $DETECT_URL (cam=$CAMERA_ID) fps=$FPS quality=$QUALITY"

while true; do
  if ffmpeg "${FFMPEG_OPTS[@]}" | \
    curl -sS -X POST -H "Content-Type: image/jpeg" -H "X-Camera-Id: $CAMERA_ID" "${AUTH_HEADER[@]}" --data-binary @- "$DETECT_URL" ; then
    : # success
  else
    echo "[rtsp_ffmpeg_loop] post failed, sleeping briefly" >&2
  fi
  sleep "$SLEEP_SECONDS"
done
