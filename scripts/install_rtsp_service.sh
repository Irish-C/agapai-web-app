#!/usr/bin/env bash
set -euo pipefail
# Installer: copy systemd unit and env, reload systemd, enable & start the service.
# Usage: sudo ./scripts/install_rtsp_service.sh

SERVICE_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../deploy/rtsp_ffmpeg.service"
ENV_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/rtsp_ffmpeg.env"

SERVICE_DST="/etc/systemd/system/rtsp_ffmpeg.service"
ENV_DST="/etc/rtsp_ffmpeg.env"

if [ "$EUID" -ne 0 ]; then
  echo "This installer requires root. Re-run with sudo."
  exit 1
fi

if [ ! -f "$SERVICE_SRC" ]; then
  echo "Service source not found: $SERVICE_SRC" >&2
  exit 2
fi

if [ ! -f "$ENV_SRC" ]; then
  echo "Env example not found: $ENV_SRC" >&2
  echo "Create $ENV_SRC or copy a custom env file and re-run." >&2
  exit 3
fi

echo "Backing up any existing files..."
if [ -f "$SERVICE_DST" ]; then
  mv "$SERVICE_DST" "${SERVICE_DST}.bak.$(date +%s)"
fi
if [ -f "$ENV_DST" ]; then
  mv "$ENV_DST" "${ENV_DST}.bak.$(date +%s)"
fi

echo "Copying service to $SERVICE_DST"
cp "$SERVICE_SRC" "$SERVICE_DST"
echo "Copying env to $ENV_DST"
cp "$ENV_SRC" "$ENV_DST"

echo "Making wrapper executable"
WRAPPER="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/rtsp_ffmpeg_loop.sh"
if [ -f "$WRAPPER" ]; then
  chmod +x "$WRAPPER"
fi

echo "Reloading systemd and enabling service"
systemctl daemon-reload
systemctl enable --now rtsp_ffmpeg.service

echo "Service installed and started. Check status with:"
echo "  sudo systemctl status rtsp_ffmpeg.service"
echo "View logs:"
echo "  sudo journalctl -u rtsp_ffmpeg.service -f"

exit 0
