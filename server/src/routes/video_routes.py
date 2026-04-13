import os
import asyncio
import httpx
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from urllib.parse import urlparse

router = APIRouter()


@router.get('/mediamtx_health')
async def mediamtx_health():
    """Check MediaMTX HTTP (API) and RTSP ingest reachability.

    Returns a JSON summary with actionable messages for the UI.
    """
    MEDIAMTX_API = os.getenv('MEDIAMTX_API', 'http://127.0.0.1:8888')
    MEDIAMTX_URL = os.getenv('MEDIAMTX_URL', 'rtsp://127.0.0.1:8888')

    result = {
        'api': {'url': MEDIAMTX_API, 'ok': False, 'status_code': None, 'error': None},
        'rtsp': {'url': MEDIAMTX_URL, 'ok': False, 'error': None},
        'ok': False,
    }

    async def _check_http(url, key):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                r = await client.get(url)
                result[key]['status_code'] = r.status_code
                result[key]['ok'] = r.status_code < 500
        except Exception as e:
            result[key]['error'] = str(e)

    async def _check_rtsp(rtsp_url):
        try:
            p = urlparse(rtsp_url)
            host = p.hostname or '127.0.0.1'
            port = p.port or 554
            fut = asyncio.open_connection(host, port)
            reader, writer = await asyncio.wait_for(fut, timeout=3)
            writer.close()
            try:
                await writer.wait_closed()
            except Exception:
                pass
            result['rtsp']['ok'] = True
        except Exception as e:
            result['rtsp']['error'] = str(e)

    await asyncio.gather(
        _check_http(MEDIAMTX_API, 'api'),
        _check_rtsp(MEDIAMTX_URL),
    )

    result['ok'] = result['api']['ok'] and result['rtsp']['ok']

    # Add friendly messages
    messages = []
    if not result['api']['ok']:
        messages.append('MediaMTX HTTP API unreachable. Check MEDIAMTX_API and that MediaMTX is running.')
    if not result['rtsp']['ok']:
        messages.append('MediaMTX RTSP ingest unreachable. Backend cannot push RTSP streams to MediaMTX.')

    result['messages'] = messages
    return JSONResponse(content=result)
