import re
from typing import Any


_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]")
_SENSITIVE_FIELD_NAMES = {
    "password",
    "old_password",
    "new_password",
    "token",
    "access_token",
    "refresh_token",
}


def _clean_string(value: str, *, preserve_outer_whitespace: bool) -> str:
    cleaned = _CONTROL_CHARS_RE.sub("", value)
    if not preserve_outer_whitespace:
        cleaned = cleaned.strip()
    return cleaned


def sanitize_input(value: Any, *, field_name: str | None = None) -> Any:
    """Recursively sanitize user-provided input structures.

    - Removes control characters (including null bytes) from strings.
    - Trims non-sensitive strings.
    - Preserves password/token field whitespace to avoid unintended auth issues.
    """
    if isinstance(value, dict):
        return {
            key: sanitize_input(item, field_name=str(key).lower())
            for key, item in value.items()
        }

    if isinstance(value, list):
        return [sanitize_input(item, field_name=field_name) for item in value]

    if isinstance(value, tuple):
        return tuple(sanitize_input(item, field_name=field_name) for item in value)

    if isinstance(value, str):
        preserve_whitespace = (field_name or "") in _SENSITIVE_FIELD_NAMES
        return _clean_string(value, preserve_outer_whitespace=preserve_whitespace)

    return value


async def get_sanitized_json(request) -> dict:
    payload = await request.json()
    return sanitize_input(payload)
