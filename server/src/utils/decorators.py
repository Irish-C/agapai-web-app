from functools import wraps
from flask_jwt_extended import get_jwt

def admin_required(fn):
    @wraps(fn)
    async def wrapper(*args, **kwargs): # Added async
        claims = get_jwt()
        if claims.get("is_admin") is True:
            return await fn(*args, **kwargs) # Added await
        else:
            return {"msg": "Admins only!"}, 403
    return wrapper