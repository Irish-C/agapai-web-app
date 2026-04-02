from datetime import date, datetime
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse

# JavaScript cannot represent integers above this exactly.
JS_MAX_SAFE_INTEGER = 9007199254740991


def _normalize_for_json(value):
    if value is None or isinstance(value, (str, float, bool)):
        return value

    if isinstance(value, int):
        return str(value) if abs(value) > JS_MAX_SAFE_INTEGER else value

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, dict):
        return {k: _normalize_for_json(v) for k, v in value.items()}

    if isinstance(value, (list, tuple, set)):
        return [_normalize_for_json(v) for v in value]

    if hasattr(value, "dict") and callable(value.dict):
        return _normalize_for_json(value.dict())

    if hasattr(value, "__dict__"):
        return _normalize_for_json(vars(value))

    return value


def safe_json_response(status_code: int, content, headers=None):
    encoded = jsonable_encoder(content)
    normalized = _normalize_for_json(encoded)
    return JSONResponse(status_code=status_code, content=normalized, headers=headers)
