"""
Feature Permission API Endpoints (Simplified SQL-based implementation)
SuperAdmin-only endpoints for managing feature-level permissions per role.
Replaces the generic role permission system with granular feature visibility control.
"""

from datetime import datetime
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import logging
import json

from database import db
from src.utils.auth import require_superadmin_user_id, get_current_user_id
from src.services.feature_service import get_feature_cache, get_feature_checker
from src.utils.feature_constants import CATEGORY_FEATURES, DEFAULT_FEATURE_VISIBILITY

router = APIRouter(prefix="/api/admin/features", tags=["features"])
logger = logging.getLogger(__name__)


# ============================================================================
# Pydantic Models
# ============================================================================

class RoleFeatureVisibilityResponse(BaseModel):
    """Feature visibility for a specific role."""
    role_id: int
    role_name: str
    features: Dict[str, bool]  # {feature_key: is_visible}
    
    class Config:
        from_attributes = True


class UpdateFeatureVisibilityRequest(BaseModel):
    """Request to change feature visibility for a role."""
    is_visible: bool
    reason: Optional[str] = "Updated via admin panel"


# ============================================================================
# GET Endpoints
# ============================================================================

@router.get("/", response_model=Dict)
async def get_all_features(
    superadmin_user_id: int = Depends(require_superadmin_user_id),
) -> Dict:
    """
    Get all features organized by category.
    Shows feature definitions (names, descriptions, etc).
    """
    return {
        category_key: {
            "category_name": CATEGORY_FEATURES[category_key][0].get("feature_name", ""),
            "features": features_list,
        }
        for category_key, features_list in CATEGORY_FEATURES.items()
    }


@router.get("/roles/{role_id}", response_model=RoleFeatureVisibilityResponse)
async def get_role_feature_visibility(
    role_id: int,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
) -> RoleFeatureVisibilityResponse:
    """Get feature visibility for a specific role."""
    
    if not db.is_connected():
        await db.connect()
    
    # Verify role exists
    role_result = await db.query_raw("SELECT id, role_name FROM roles WHERE id = ?", role_id)
    if not role_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not found"
        )
    
    role = role_result[0]
    
    # Get feature visibility from database or defaults
    features = {}
    
    # Get all features
    all_features = await db.query_raw("""
        SELECT id, feature_key FROM category_features
    """)
    
    for feature in all_features:
        feature_key = feature['feature_key']
        feature_id = feature['id']
        
        # Check for override in database
        perm_result = await db.query_raw("""
            SELECT is_visible FROM category_feature_permissions 
            WHERE feature_id = ? AND role_id = ?
        """, feature_id, role_id)
        
        if perm_result:
            features[feature_key] = bool(perm_result[0]['is_visible'])
        else:
            # Use default from code
            features[feature_key] = DEFAULT_FEATURE_VISIBILITY.get(
                role['role_name'], {}
            ).get(feature_key, False)
    
    return RoleFeatureVisibilityResponse(
        role_id=role_id,
        role_name=role['role_name'],
        features=features
    )


@router.get("/roles", response_model=List[RoleFeatureVisibilityResponse])
async def get_all_roles_feature_visibility(
    superadmin_user_id: int = Depends(require_superadmin_user_id),
) -> List[RoleFeatureVisibilityResponse]:
    """Get feature visibility for all roles."""
    
    if not db.is_connected():
        await db.connect()
    
    roles = await db.query_raw("SELECT id, role_name FROM roles ORDER BY id")
    response = []
    
    for role in roles:
        role_id = role['id']
        role_name = role['role_name']
        
        # Get feature visibility
        features = {}
        all_features = await db.query_raw("SELECT id, feature_key FROM category_features")
        
        for feature in all_features:
            feature_key = feature['feature_key']
            feature_id = feature['id']
            
            perm_result = await db.query_raw("""
                SELECT is_visible FROM category_feature_permissions 
                WHERE feature_id = ? AND role_id = ?
            """, feature_id, role_id)
            
            if perm_result:
                features[feature_key] = bool(perm_result[0]['is_visible'])
            else:
                features[feature_key] = DEFAULT_FEATURE_VISIBILITY.get(
                    role_name, {}
                ).get(feature_key, False)
        
        response.append(
            RoleFeatureVisibilityResponse(
                role_id=role_id,
                role_name=role_name,
                features=features
            )
        )
    
    return response


@router.get("/me", response_model=Dict[str, bool])
async def get_current_user_features(
    user_id: str = Depends(get_current_user_id),
) -> Dict[str, bool]:
    """
    Get feature visibility for the currently authenticated user.
    Returns {feature_key: is_visible} for all features accessible to the user's role.
    Useful for frontend to show/hide UI elements based on feature availability.
    """
    
    if not db.is_connected():
        await db.connect()
    
    # Get user's role
    user_result = await db.query_raw("""
        SELECT role_id FROM users WHERE id = ?
    """, int(user_id))
    
    if not user_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    role_id = user_result[0]['role_id']
    
    # Get role name for defaults
    role_result = await db.query_raw("""
        SELECT role_name FROM roles WHERE id = ?
    """, role_id)
    
    if not role_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User role not found"
        )
    
    role_name = role_result[0]['role_name']
    
    # Get feature visibility
    features = {}
    all_features = await db.query_raw("""
        SELECT id, feature_key FROM category_features
    """)
    
    for feature in all_features:
        feature_key = feature['feature_key']
        feature_id = feature['id']
        
        # Check for override in database
        perm_result = await db.query_raw("""
            SELECT is_visible FROM category_feature_permissions 
            WHERE feature_id = ? AND role_id = ?
        """, feature_id, role_id)
        
        if perm_result:
            features[feature_key] = bool(perm_result[0]['is_visible'])
        else:
            # Use default from code
            features[feature_key] = DEFAULT_FEATURE_VISIBILITY.get(
                role_name, {}
            ).get(feature_key, False)
    
    return features


# ============================================================================
# PUT Endpoints - Update Feature Visibility
# ============================================================================

@router.put("/roles/{role_id}/features/{feature_key}")
async def update_feature_visibility(
    role_id: int,
    feature_key: str,
    request: UpdateFeatureVisibilityRequest,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """Update visibility of a single feature for a role."""
    
    if not db.is_connected():
        await db.connect()
    
    # Verify role exists
    role_result = await db.query_raw("SELECT id, role_name FROM roles WHERE id = ?", role_id)
    if not role_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not found"
        )
    
    role = role_result[0]
    
    # Verify feature exists
    feature_result = await db.query_raw("""
        SELECT id FROM category_features WHERE feature_key = ?
    """, feature_key)
    
    if not feature_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature {feature_key} not found"
        )
    
    feature_id = feature_result[0]['id']
    is_visible_int = 1 if request.is_visible else 0
    
    # Get old value
    perm_result = await db.query_raw("""
        SELECT is_visible FROM category_feature_permissions 
        WHERE feature_id = ? AND role_id = ?
    """, feature_id, role_id)
    
    old_value = bool(perm_result[0]['is_visible']) if perm_result else DEFAULT_FEATURE_VISIBILITY.get(
        role['role_name'], {}
    ).get(feature_key, False)
    
    # Skip if no change
    if old_value == request.is_visible:
        return {
            "message": "No change",
            "role_id": role_id,
            "feature_key": feature_key,
            "is_visible": request.is_visible,
        }
    
    # Update or insert permission
    if perm_result:
        await db.query_raw("""
            UPDATE category_feature_permissions 
            SET is_visible = ?, updated_at = NOW()
            WHERE feature_id = ? AND role_id = ?
        """, is_visible_int, feature_id, role_id)
    else:
        await db.query_raw("""
            INSERT INTO category_feature_permissions (feature_id, role_id, is_visible, created_at, updated_at)
            VALUES (?, ?, ?, NOW(), NOW())
        """, feature_id, role_id, is_visible_int)
    
    # Create audit log if applicable
    try:
        # Get feature name for audit
        feature_name_result = await db.query_raw("""
            SELECT feature_name FROM category_features WHERE id = ?
        """, feature_id)
        
        feature_name = feature_name_result[0]['feature_name'] if feature_name_result else feature_key
        
        await db.query_raw("""
            INSERT INTO feature_audit_logs 
            (feature_id, role_id, feature_key, feature_name, old_value, new_value, changed_by, reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        """, feature_id, role_id, feature_key, feature_name, 
         1 if old_value else 0, is_visible_int, superadmin_user_id, request.reason)
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
    
    # Invalidate cache
    cache = get_feature_cache()
    cache.invalidate(role_id)
    
    return {
        "message": "Feature visibility updated",
        "role_id": role_id,
        "feature_key": feature_key,
        "old_value": old_value,
        "new_value": request.is_visible,
    }
