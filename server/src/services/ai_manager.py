import subprocess
import time
import requests
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class AIServiceManager:
    """Manages Flask AI detection service lifecycle"""
    
    def __init__(self, ai_service_dir: str, backend_url: str = "http://localhost:5000"):
        self.ai_service_dir = ai_service_dir
        self.backend_url = backend_url
        self.process: Optional[subprocess.Popen] = None
        self.active_cameras = {}  # {camera_id: rtsp_url}
    
    def is_running(self) -> bool:
        """Check if AI service is running"""
        if self.process is None:
            return False
        return self.process.poll() is None
    
    def start(self) -> bool:
        """Start the Flask AI service"""
        if self.is_running():
            logger.warning("[AIManager] AI service already running")
            return True
        
        try:
            logger.info("[AIManager] Starting AI service...")
            self.process = subprocess.Popen(
                ["python3", "app.py"],
                cwd=self.ai_service_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            time.sleep(2)
            
            if self.is_running():
                logger.info("[AIManager] ✓ AI service started")
                return True
            else:
                logger.error("[AIManager] ✗ AI service failed to start")
                return False
        except Exception as e:
            logger.error(f"[AIManager] Could not start AI service: {e}")
            return False
    
    def stop(self) -> bool:
        """Stop the Flask AI service"""
        if not self.is_running():
            return True
        
        try:
            logger.info("[AIManager] Stopping AI service...")
            self.process.terminate()
            self.process.wait(timeout=5)
            self.active_cameras.clear()
            logger.info("[AIManager] ✓ AI service stopped")
            return True
        except subprocess.TimeoutExpired:
            self.process.kill()
            logger.warning("[AIManager] AI service force killed")
            return False
        except Exception as e:
            logger.error(f"[AIManager] Error stopping AI service: {e}")
            return False
    
    def start_detection(self, camera_id: int, rtsp_url: str) -> bool:
        """Start detection on a camera"""
        if not self.is_running():
            if not self.start():
                return False
        
        try:
            payload = {
                "camera_id": camera_id,
                "rtsp_url": rtsp_url
            }
            response = requests.post(
                "http://localhost:3000/api/start",
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                self.active_cameras[camera_id] = rtsp_url
                logger.info(f"[AIManager] Detection started for camera {camera_id}")
                return True
            else:
                logger.error(f"[AIManager] Failed to start detection: {response.text}")
                return False
        except Exception as e:
            logger.error(f"[AIManager] Error starting detection: {e}")
            return False
    
    def stop_detection(self, camera_id: int) -> bool:
        """Stop detection on a camera"""
        try:
            response = requests.post(
                "http://localhost:3000/api/stop",
                json={"camera_id": camera_id},
                timeout=5
            )
            
            if response.status_code == 200:
                self.active_cameras.pop(camera_id, None)
                logger.info(f"[AIManager] Detection stopped for camera {camera_id}")
                return True
            else:
                return False
        except Exception as e:
            logger.error(f"[AIManager] Error stopping detection: {e}")
            return False
