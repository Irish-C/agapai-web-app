"""
Permission-based authorization dependencies for FastAPI.
Provides granular permission checking for route protection.
"""

from typing import Callable, Optional, Set
from fastapi import Depends, HTTPException, status

from src.services.permission_service import get_permission_checker
from src.utils.auth import get_current_user

# ============================================================================
# Single Permission Check
# ============================================================================

def require_permission(permission_name: str) -> Callable:
    """
    Dependency that requires the current user to have a specific permission.
    
    Usage:
        @app.get("/protected")
        async def protected_route(
            user = Depends(get_current_user),
            _: None = Depends(require_permission("Manage Cameras"))
        ):
            ...
    """
    async def check_permission(
        user = Depends(get_current_user),
    ) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
            
        checker = get_permission_checker()
        has_perm = await checker.has_permission(
            user.role_id,
            permission_name,
        )
        
        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have '{permission_name}' permission"
            )
    
    return check_permission


# ============================================================================
# Multiple Permission Checks
# ============================================================================

def require_any_permission(*permissions: str) -> Callable:
    """
    Dependency that requires the user to have ANY of the specified permissions.
    
    Usage:
        @app.get("/protected")
        async def protected_route(
            user = Depends(get_current_user),
            _: None = Depends(require_any_permission("Manage Cameras", "View Reports"))
        ):
            ...
    """
    async def check_permissions(
        user = Depends(get_current_user),
    ) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        if not permissions:
            return  # No permissions to check
        
        checker = get_permission_checker()
        has_any = await checker.has_any_permission(
            user.role_id,
            set(permissions),
        )
        
        if not has_any:
            perm_str = ", ".join(permissions)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User does not have any of these permissions: {perm_str}"
            )
    
    return check_permissions


def require_all_permissions(*permissions: str) -> Callable:
    """
    Dependency that requires the user to have ALL of the specified permissions.
    
    Usage:
        @app.get("/protected")
        async def protected_route(
            user = Depends(get_current_user),
            _: None = Depends(require_all_permissions("Manage Cameras", "Delete Data"))
        ):
            ...
    """
    async def check_permissions(
        user = Depends(get_current_user),
    ) -> None:
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated"
            )
        
        if not permissions:
            return  # No permissions to check
        
        checker = get_permission_checker()
        has_all = await checker.has_all_permissions(
            user.role_id,
            set(permissions),
        )
        
        if not has_all:
            perm_str = ", ".join(permissions)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"User must have all of these permissions: {perm_str}"
            )
    
    return check_permissions


# ============================================================================
# Get User Permissions
# ============================================================================

async def get_user_permissions(
    user = Depends(get_current_user),
) -> Set[str]:
    """
    Get all granted permissions for the current user's role.
    Can be used to show available actions in the UI.
    """
    if not user:
        return set()
        
    checker = get_permission_checker()
    return await checker.get_granted_permissions(user.role_id)


async def get_user_denied_permissions(
    user = Depends(get_current_user),
) -> Set[str]:
    """
    Get all denied permissions for the current user's role.
    """
    if not user:
        return set()
        
    checker = get_permission_checker()
    return await checker.get_denied_permissions(user.role_id)


# ============================================================================
# Permission Check Functions (for programmatic checks without FastAPI)
# ============================================================================

async def check_permission_for_role(
    role_id: int,
    permission_name: str,
) -> bool:
    """
    Check if a specific role has a permission.
    Use this for non-route code that needs permission checks.
    """
    checker = get_permission_checker()
    return await checker.has_permission(role_id, permission_name)


async def check_any_permission_for_role(
    role_id: int,
    permissions: Set[str],
) -> bool:
    """Check if a role has any of the specified permissions."""
    checker = get_permission_checker()
    return await checker.has_any_permission(role_id, permissions)


async def check_all_permissions_for_role(
    role_id: int,
    permissions: Set[str],
) -> bool:
    """Check if a role has all the specified permissions."""
    checker = get_permission_checker()
    return await checker.has_all_permissions(role_id, permissions)
