"""
Feature-based authorization dependencies for FastAPI.
Provides granular feature-level access control for route protection.
Replaces generic permission-based checks with specific feature visibility.
"""

from typing import Callable, Optional, Set
from fastapi import Depends, HTTPException, status

from src.services.feature_service import get_feature_checker
from src.utils.auth import get_current_user_id
from database import db

# ============================================================================
# Helper: Get Current User with Role
# ============================================================================

async def get_current_user_with_role(user_id: str = Depends(get_current_user_id)):
    """
    Fetch the current user with their role information.
    Used by feature auth functions.
    """
    try:
        user = await db.user.find_unique(
            where={'id': int(user_id)},
            include={'role': True},
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='User not found'
            )
        return user
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid user ID format'
        )
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error fetching user with role: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Failed to authenticate user'
        )


# ============================================================================
# Single Feature Check
# ============================================================================

def require_feature(feature_key: str) -> Callable:
    """
    Dependency that requires the current user's role to have a specific feature visible.
    
    Args:
        feature_key: The feature key to check (e.g., 'add_camera', 'archive_user')
    
    Usage:
        @app.get("/protected")
        async def protected_route(
            _: None = Depends(require_feature("add_camera"))
        ):
            ...
    """
    async def check_feature(
        user = Depends(get_current_user_with_role),
    ) -> None:
        if not user or not user.role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User has no role assigned"
            )
        
        checker = get_feature_checker()
        has_feat = await checker.has_feature(
            user.role_id,
            feature_key,
        )
        
        if not has_feat:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature_key}' is not available to your role"
            )
    
    return check_feature


# ============================================================================
# Multiple Feature Checks
# ============================================================================

def require_any_feature(*feature_keys: str) -> Callable:
    """
    Dependency that requires the user to have ANY of the specified features visible.
    
    Args:
        *feature_keys: One or more feature keys to check
    
    Usage:
        @app.get("/protected")
        async def protected_route(
            _: None = Depends(require_any_feature("add_camera", "edit_camera"))
        ):
            ...
    """
    async def check_features(
        user = Depends(get_current_user_with_role),
    ) -> None:
        if not user or not user.role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User has no role assigned"
            )
        
        if not feature_keys:
            return  # No features to check
        
        checker = get_feature_checker()
        has_any = await checker.has_any_feature(
            user.role_id,
            set(feature_keys),
        )
        
        if not has_any:
            feat_str = ", ".join(feature_keys)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature access denied. Required: any of [{feat_str}]"
            )
    
    return check_features


def require_all_features(*feature_keys: str) -> Callable:
    """
    Dependency that requires the user to have ALL of the specified features visible.
    
    Args:
        *feature_keys: One or more feature keys that are all required
    
    Usage:
        @app.get("/protected")
        async def protected_route(
            _: None = Depends(require_all_features("view_cameras", "edit_camera"))
        ):
            ...
    """
    async def check_features(
        user = Depends(get_current_user_with_role),
    ) -> None:
        if not user or not user.role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User has no role assigned"
            )
        
        if not feature_keys:
            return  # No features to check
        
        checker = get_feature_checker()
        has_all = await checker.has_all_features(
            user.role_id,
            set(feature_keys),
        )
        
        if not has_all:
            feat_str = ", ".join(feature_keys)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature access denied. Required: all of [{feat_str}]"
            )
    
    return check_features


# ============================================================================
# Get User Features
# ============================================================================

async def get_user_features(
    user = Depends(get_current_user_with_role),
) -> Set[str]:
    """
    Get all visible features for the current user's role.
    Can be used to show available actions in the UI.
    
    Returns:
        Set of feature_keys that are visible to the user
    """
    if not user or not user.role:
        return set()
    
    checker = get_feature_checker()
    features = await checker.get_visible_features(user.role_id)
    return features


async def get_hidden_user_features(
    user = Depends(get_current_user_with_role),
) -> Set[str]:
    """
    Get all hidden/unavailable features for the current user's role.
    Useful for disabling UI elements not available to the user.
    
    Returns:
        Set of feature_keys that are NOT visible to the user
    """
    if not user or not user.role:
        # If no role, return all features as hidden
        from src.utils.feature_constants import get_all_features_for_role
        all_features = get_all_features_for_role("caregiver")  # Minimum role
        return set(all_features.keys())
    
    checker = get_feature_checker()
    hidden = await checker.get_hidden_features(user.role_id)
    return hidden
