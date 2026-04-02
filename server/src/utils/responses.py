"""
Custom FastAPI response classes.

Contains response formatters for handling BigInt serialization and other
custom response handling.
"""

import json
from typing import Any
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder


class PrismaJSONResponse(JSONResponse):
    """JSON response that handles BigInt serialization for Prisma models.
    
    JavaScript's max safe integer is 2^53-1 (9007199254740991). This response
    class converts any integer exceeding this limit to a string to prevent
    precision loss when the response is parsed by the client.
    """
    
    def render(self, content: Any) -> bytes:
        def format_bigint(obj):
            # JavaScript's Max Safe Integer limit
            if isinstance(obj, int) and (obj > 9007199254740991 or obj < -9007199254740991):
                return str(obj)
            if isinstance(obj, list):
                return [format_bigint(i) for i in obj]
            if isinstance(obj, dict):
                return {k: format_bigint(v) for k, v in obj.items()}
            return obj

        content = format_bigint(jsonable_encoder(content))
        return json.dumps(content).encode("utf-8")
