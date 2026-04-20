import os
import httpx
import sys
from fastapi import APIRouter
from fastapi.responses import JSONResponse

router = APIRouter()

AI_SERVICE_URL = "http://127.0.0.1:3000"

@router.get('/stream_health')
async def get_stream_health():
    """Proxy stream health from AI service"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{AI_SERVICE_URL}/stream_health")
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        # Return disconnected status if AI service is unavailable
        print(f"[STREAM_HEALTH_ERROR] {type(e).__name__}: {e}", file=sys.stderr)
        pass
    
    return {
        "connected": False,
        "error_message": "AI service unavailable",
        "consecutive_failed_reads": 0,
        "time_since_last_frame": 0,
        "camera_id": 1
    }

@router.get('/hardware_health')
async def get_hardware_health():
    """Proxy hardware health from AI service"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{AI_SERVICE_URL}/hardware_health")
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        # Return disconnected status if AI service is unavailable
        pass
    
    return {
        "connected": False,
        "error_message": "AI service unavailable",
        "last_successful_send": None
    }
