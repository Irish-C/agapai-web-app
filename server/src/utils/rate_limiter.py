import time
import os
from typing import Optional, Tuple

from fastapi import Request

from src.utils.redis_pool import RedisConnectionPool


_ENV = os.getenv('ENV') or os.getenv('ENVIRONMENT') or 'development'
_ENV = _ENV.strip().lower()


def _env_int(name: str, default_value: int, min_value: int = 1) -> int:
    raw = os.getenv(name)
    if raw is None:
        return max(default_value, min_value)

    try:
        parsed = int(raw)
        return max(parsed, min_value)
    except (TypeError, ValueError):
        return max(default_value, min_value)


if _ENV in ('production', 'prod'):
    _default_global_limit = 240
    _default_login_limit = 8
    _default_login_fail_threshold = 5
    _default_login_lockout_seconds = 15 * 60
elif _ENV in ('staging', 'stage'):
    _default_global_limit = 300
    _default_login_limit = 10
    _default_login_fail_threshold = 5
    _default_login_lockout_seconds = 10 * 60
else:
    # Development defaults are looser to reduce local lockout friction.
    _default_global_limit = 1200
    _default_login_limit = 30
    _default_login_fail_threshold = 10
    _default_login_lockout_seconds = 5 * 60


API_GLOBAL_RATE_LIMIT = _env_int('API_GLOBAL_RATE_LIMIT', _default_global_limit)
API_GLOBAL_RATE_WINDOW_SECONDS = _env_int('API_GLOBAL_RATE_WINDOW_SECONDS', 60)
LOGIN_RATE_LIMIT = _env_int('LOGIN_RATE_LIMIT', _default_login_limit)
LOGIN_RATE_WINDOW_SECONDS = _env_int('LOGIN_RATE_WINDOW_SECONDS', 60)
LOGIN_FAIL_THRESHOLD = _env_int('LOGIN_FAIL_THRESHOLD', _default_login_fail_threshold)
LOGIN_LOCKOUT_SECONDS = _env_int('LOGIN_LOCKOUT_SECONDS', _default_login_lockout_seconds)


def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get('x-forwarded-for', '')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()

    if request.client and request.client.host:
        return request.client.host

    return 'unknown'


def _redis_client():
    return RedisConnectionPool.get()


def _incr_with_expiry(key: str, window_seconds: int) -> int:
    client = _redis_client()
    count = client.incr(key)
    if count == 1:
        client.expire(key, window_seconds)
    return int(count)


async def enforce_ip_rate_limit(
    request: Request,
    namespace: str,
    limit: int,
    window_seconds: int,
) -> Tuple[bool, int]:
    ip = get_client_ip(request)
    now = int(time.time())
    window_bucket = now // window_seconds
    key = f'rate:{namespace}:{ip}:{window_bucket}'

    count = _incr_with_expiry(key, window_seconds)
    if count <= limit:
        return True, 0

    retry_after = window_seconds - (now % window_seconds)
    return False, retry_after


def _sanitize_username(username: Optional[str]) -> str:
    if not isinstance(username, str):
        return 'unknown'
    return username.strip().lower()[:80] or 'unknown'


async def check_login_lockout(request: Request, username: Optional[str]) -> Tuple[bool, int]:
    ip = get_client_ip(request)
    normalized_username = _sanitize_username(username)
    lock_key = f'auth:lock:{ip}:{normalized_username}'

    client = _redis_client()
    ttl = client.ttl(lock_key)
    if ttl and ttl > 0:
        return True, int(ttl)

    return False, 0


async def record_login_failure(request: Request, username: Optional[str]) -> None:
    ip = get_client_ip(request)
    normalized_username = _sanitize_username(username)
    fail_key = f'auth:fail:{ip}:{normalized_username}'
    lock_key = f'auth:lock:{ip}:{normalized_username}'

    fail_count = _incr_with_expiry(fail_key, LOGIN_LOCKOUT_SECONDS)
    if fail_count >= LOGIN_FAIL_THRESHOLD:
        client = _redis_client()
        client.set(lock_key, '1', ex=LOGIN_LOCKOUT_SECONDS)


async def clear_login_failures(request: Request, username: Optional[str]) -> None:
    ip = get_client_ip(request)
    normalized_username = _sanitize_username(username)
    fail_key = f'auth:fail:{ip}:{normalized_username}'
    lock_key = f'auth:lock:{ip}:{normalized_username}'

    client = _redis_client()
    client.delete(fail_key)
    client.delete(lock_key)
