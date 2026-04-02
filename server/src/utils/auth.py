import os
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from database import db
from src.utils.role_utils import normalize_role

SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
JWT_ISSUER = os.getenv('JWT_ISSUER', 'agapai-api')
JWT_AUDIENCE = os.getenv('JWT_AUDIENCE', 'agapai-client')

if not SECRET_KEY:
    raise RuntimeError('FLASK_SECRET_KEY must be set for secure JWT signing')

security = HTTPBearer()


def _decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=['HS256'],
        issuer=JWT_ISSUER,
        audience=JWT_AUDIENCE,
    )


def create_token(user_id: str) -> str:
    payload = {
        'sub': str(user_id),
        'iss': JWT_ISSUER,
        'aud': JWT_AUDIENCE,
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(hours=12),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    token = credentials.credentials
    try:
        payload = _decode_token(token)
        user_id = payload.get('sub')
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Invalid authentication credentials',
            )

        # Deny access if the account was archived/deleted after token issuance.
        user = await db.user.find_unique(where={'id': int(user_id)})
        if not user or not getattr(user, 'is_active', True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Account is inactive or archived',
            )

        return str(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token has expired',
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid authentication credentials',
        )


def get_token_user_id_from_header(authorization_header: Optional[str]) -> Optional[str]:
    # Legacy helper (similar to previous implementation) for non-FastAPI usage.
    if not authorization_header:
        return None
    if authorization_header.startswith('Bearer '):
        token = authorization_header.split(' ', 1)[1].strip()
        try:
            payload = _decode_token(token)
            return payload.get('sub')
        except Exception:
            return None
    return None


async def require_admin_user_id(user_id: str = Depends(get_current_user_id)) -> str:
    try:
        user = await db.user.find_unique(
            where={'id': int(user_id)},
            include={'role': True},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid authentication credentials',
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid authentication credentials',
        )

    role_name = normalize_role(user.role.role_name) if user.role else None
    if role_name != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admin privileges required',
        )

    return str(user.id)


async def require_admin_or_supervisor_user_id(
    user_id: str = Depends(get_current_user_id),
) -> str:
    try:
        user = await db.user.find_unique(
            where={'id': int(user_id)},
            include={'role': True},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid authentication credentials',
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid authentication credentials',
        )

    role_name = normalize_role(user.role.role_name) if user.role else None
    if role_name not in {'admin', 'supervisor'}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admin or supervisor privileges required',
        )

    return str(user.id)
