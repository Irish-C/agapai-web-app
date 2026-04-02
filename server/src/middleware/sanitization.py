"""
Request sanitization and rate limiting middleware.

Handles:
- Sanitizing incoming JSON bodies
- Global API rate limiting
- Socket.IO route bypass
"""

import json
from fastapi.responses import JSONResponse
from src.utils.input_sanitization import sanitize_input
from src.utils.rate_limiter import (
    enforce_ip_rate_limit,
    API_GLOBAL_RATE_LIMIT,
    API_GLOBAL_RATE_WINDOW_SECONDS,
)


async def bigint_middleware(request, call_next):
    """Middleware to sanitize JSON bodies and enforce global rate limiting.
    
    - Sanitizes incoming JSON bodies so controllers receive cleaned data.
    - Reads the raw body, sanitizes it with `sanitize_input`, and injects
      a new receive() coroutine so downstream `await request.json()`
      returns the sanitized payload.
    - Skips socket.io routes (they need to pass through unmodified).
    - Enforces global API rate limiting on /api routes (except /api/login).
    """
    
    # Skip socket.io routes - they need to pass through unmodified
    if request.url.path.startswith('/socket.io'):
        return await call_next(request)

    # Global API rate limiting (separate stricter rule on /api/login route)
    if request.url.path.startswith('/api') and request.url.path != '/api/login':
        allowed, retry_after = await enforce_ip_rate_limit(
            request=request,
            namespace='api_global',
            limit=API_GLOBAL_RATE_LIMIT,
            window_seconds=API_GLOBAL_RATE_WINDOW_SECONDS,
        )
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    'status': 'error',
                    'message': 'Rate limit exceeded. Please retry later.',
                    'retry_after_seconds': retry_after,
                },
                headers={'Retry-After': str(retry_after)},
            )
    
    try:
        content_type = request.headers.get('content-type', '')
        if 'application/json' in content_type.lower():
            body_bytes = await request.body()
            if body_bytes:
                try:
                    payload = json.loads(body_bytes)
                    sanitized = sanitize_input(payload)
                    new_body = json.dumps(sanitized).encode('utf-8')

                    async def receive():
                        return {"type": "http.request", "body": new_body}

                    # Replace the request's receive with one that returns the
                    # sanitized body. This makes `await request.json()` return
                    # the sanitized payload.
                    request._receive = receive
                except Exception:
                    # If parsing/sanitization fails, fall back to original body
                    pass
    except Exception:
        # Be defensive: do not block requests because sanitization failed.
        pass

    response = await call_next(request)
    return response
