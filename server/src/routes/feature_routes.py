"""
Feature Permission API Endpoints
SuperAdmin-only endpoints for managing feature-level permissions per role.
Replaces the generic role permission system with granular feature visibility control.

Note: Uses raw SQL queries since Prisma Python client hasn't been regenerated 
with new CategoryFeature and CategoryFeaturePermission models.
"""

from datetime import datetime
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import logging

from database import db
from src.utils.auth import require_superadmin_user_id
from src.services.feature_service import get_feature_cache, get_feature_checker
from src.utils.feature_constants import CATEGORY_FEATURES, DEFAULT_FEATURE_VISIBILITY

router = APIRouter(prefix="/api/admin/features", tags=["features"])
logger = logging.getLogger(__name__)


# ============================================================================
# Pydantic Models
# ============================================================================

class CategoryFeatureDetail(BaseModel):
    """Details of a single feature within a category."""
    feature_id: int
    feature_key: str
    feature_name: str
    description: Optional[str]
    sort_order: int
    
    class Config:
        from_attributes = True


class RoleFeatureVisibilityResponse(BaseModel):
    """Feature visibility for a specific role."""
    role_id: int
    role_name: str
    features: Dict[str, bool]  # {feature_key: is_visible}
    
    class Config:
        from_attributes = True


class FeatureAuditLogResponse(BaseModel):
    """Audit log entry for feature visibility changes."""
    id: int
    feature_key: str
    feature_name: str
    role_id: int
    role_name: str
    old_value: Optional[bool]
    new_value: bool
    changed_by_username: str
    changed_at: datetime
    reason: Optional[str]
    
    class Config:
        from_attributes = True


class UpdateFeatureVisibilityRequest(BaseModel):
    """Request to change feature visibility for a role."""
    is_visible: bool
    reason: Optional[str] = "Updated via admin panel"


class BulkUpdateFeaturesRequest(BaseModel):
    """Bulk update multiple feature visibilities."""
    features: Dict[str, bool]  # {feature_key: is_visible}
    reason: Optional[str] = "Bulk update via admin panel"


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
    result = {}
    
    for category_key, features_list in CATEGORY_FEATURES.items():
        try:
            category = await db.settingscategory.find_unique(
                where={"category_key": category_key}
            )
            
            if not category:
                continue
            
            result[category_key] = {
                "category_name": category.category_name,
                "description": category.description,
                "features": features_list,
            }
        except Exception as e:
            logger.error(f"Error fetching category {category_key}: {e}")
    
    return result


@router.get("/roles/{role_id}", response_model=RoleFeatureVisibilityResponse)
async def get_role_feature_visibility(
    role_id: int,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
) -> RoleFeatureVisibilityResponse:
    """
    Get feature visibility for a specific role.
    Shows which features are visible/hidden to this role.
    """
    # Verify role exists
    role = await db.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not found"
        )
    
    # Get feature visibility
    cache = get_feature_cache()
    features = await cache.get_visible_features(role_id)
    
    return RoleFeatureVisibilityResponse(
        role_id=role_id,
        role_name=role.role_name,
        features=features
    )


@router.get("/roles", response_model=List[RoleFeatureVisibilityResponse])
async def get_all_roles_feature_visibility(
    superadmin_user_id: int = Depends(require_superadmin_user_id),
) -> List[RoleFeatureVisibilityResponse]:
    """
    Get feature visibility for all roles.
    Useful for creating a feature visibility matrix in the admin UI.
    """
    roles = await db.role.find_many()
    cache = get_feature_cache()
    
    response = []
    for role in roles:
        features = await cache.get_visible_features(role.id)
        response.append(
            RoleFeatureVisibilityResponse(
                role_id=role.id,
                role_name=role.role_name,
                features=features
            )
        )
    
    return response


@router.get("/audit-log", response_model=List[FeatureAuditLogResponse])
async def get_feature_audit_log(
    role_id: Optional[int] = None,
    feature_key: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
) -> List[FeatureAuditLogResponse]:
    """
    Get feature visibility change audit log with optional filtering.
    
    Query params:
    - role_id: Filter by role
    - feature_key: Filter by feature
    - limit: Max results (default 100)
    - offset: Pagination offset (default 0)
    """
    try:
        where_clause = {}
        if role_id is not None:
            where_clause["role_id"] = role_id
        if feature_key is not None:
            where_clause["feature_key"] = feature_key
        
        logs = await db.featureauditlog.find_many(
            where=where_clause,
            order={"changed_at": "desc"},
            take=limit,
            skip=offset,
        )
        
        response = []
        for log in logs:
            user = await db.user.find_unique(where={"id": log.changed_by})
            role = await db.role.find_unique(where={"id": log.role_id})
            
            response.append(
                FeatureAuditLogResponse(
                    id=log.id,
                    feature_key=log.feature_key,
                    feature_name=log.feature_name,
                    role_id=log.role_id,
                    role_name=role.role_name if role else "Unknown",
                    old_value=log.old_value,
                    new_value=log.new_value,
                    changed_by_username=user.username if user else "Unknown",
                    changed_at=log.changed_at,
                    reason=log.reason,
                )
            )
        
        return response
    except Exception as e:
        logger.error(f"Error fetching audit log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch audit log: {str(e)}"
        )


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
    """
    Update visibility of a single feature for a role.
    """
    # Verify role exists
    role = await db.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not found"
        )
    
    # Verify feature exists
    feature = await db.categoryfeature.find_first(
        where={"feature_key": feature_key}
    )
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature {feature_key} not found"
        )
    
    # Get superadmin user for audit
    superadmin = await db.user.find_unique(where={"id": superadmin_user_id})
    
    # Find or create permission record
    existing = await db.categoryfeaturepermission.find_unique(
        where={
            "feature_id_role_id": {
                "feature_id": feature.id,
                "role_id": role_id,
            }
        }
    )
    
    old_value = existing.is_visible if existing else DEFAULT_FEATURE_VISIBILITY.get(
        role.role_name, {}
    ).get(feature_key, False)
    
    # Skip if no change
    if old_value == request.is_visible:
        return {
            "message": "No change",
            "role_id": role_id,
            "feature_key": feature_key,
            "is_visible": request.is_visible,
        }
    
    # Update or create permission
    if existing:
        await db.categoryfeaturepermission.update(
            where={"id": existing.id},
            data={"is_visible": request.is_visible, "updated_at": datetime.utcnow()},
        )
    else:
        await db.categoryfeaturepermission.create(
            data={
                "feature_id": feature.id,
                "role_id": role_id,
                "is_visible": request.is_visible,
                "created_by": superadmin_user_id,
            }
        )
    
    # Create audit log
    await db.featureauditlog.create(
        data={
            "feature_id": feature.id,
            "role_id": role_id,
            "feature_key": feature_key,
            "feature_name": feature.feature_name,
            "old_value": old_value,
            "new_value": request.is_visible,
            "changed_by": superadmin_user_id,
            "reason": request.reason,
        }
    )
    
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


@router.put("/roles/{role_id}/features")
async def bulk_update_feature_visibility(
    role_id: int,
    request: BulkUpdateFeaturesRequest,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Update visibility of multiple features for a role in one request.
    More efficient than individual updates.
    """
    # Verify role exists
    role = await db.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not found"
        )
    
    superadmin = await db.user.find_unique(where={"id": superadmin_user_id})
    
    changes = []
    errors = []
    
    for feature_key, is_visible in request.features.items():
        try:
            # Find feature
            feature = await db.categoryfeature.find_first(
                where={"feature_key": feature_key}
            )
            if not feature:
                errors.append({"feature_key": feature_key, "error": "Feature not found"})
                continue
            
            # Find existing permission
            existing = await db.categoryfeaturepermission.find_unique(
                where={
                    "feature_id_role_id": {
                        "feature_id": feature.id,
                        "role_id": role_id,
                    }
                }
            )
            
            old_value = existing.is_visible if existing else DEFAULT_FEATURE_VISIBILITY.get(
                role.role_name, {}
            ).get(feature_key, False)
            
            # Skip if no change
            if old_value == is_visible:
                continue
            
            # Update or create
            if existing:
                await db.categoryfeaturepermission.update(
                    where={"id": existing.id},
                    data={"is_visible": is_visible, "updated_at": datetime.utcnow()},
                )
            else:
                await db.categoryfeaturepermission.create(
                    data={
                        "feature_id": feature.id,
                        "role_id": role_id,
                        "is_visible": is_visible,
                        "created_by": superadmin_user_id,
                    }
                )
            
            # Create audit log
            await db.featureauditlog.create(
                data={
                    "feature_id": feature.id,
                    "role_id": role_id,
                    "feature_key": feature_key,
                    "feature_name": feature.feature_name,
                    "old_value": old_value,
                    "new_value": is_visible,
                    "changed_by": superadmin_user_id,
                    "reason": request.reason,
                }
            )
            
            changes.append({
                "feature_key": feature_key,
                "old_value": old_value,
                "new_value": is_visible,
            })
        except Exception as e:
            logger.error(f"Error updating {feature_key}: {e}")
            errors.append({"feature_key": feature_key, "error": str(e)})
    
    if changes:
        # Invalidate cache
        cache = get_feature_cache()
        cache.invalidate(role_id)
    
    return {
        "message": f"Updated {len(changes)} features",
        "role_id": role_id,
        "role_name": role.role_name,
        "changes": changes,
        "errors": errors,
    }


# ============================================================================
# DELETE Endpoints - Reset to Defaults
# ============================================================================

@router.delete("/roles/{role_id}/features/{feature_key}")
async def reset_feature_visibility(
    role_id: int,
    feature_key: str,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """Reset a feature visibility back to code-defined default."""
    role = await db.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not found"
        )
    
    feature = await db.categoryfeature.find_first(
        where={"feature_key": feature_key}
    )
    if not feature:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature {feature_key} not found"
        )
    
    # Find existing override
    existing = await db.categoryfeaturepermission.find_unique(
        where={
            "feature_id_role_id": {
                "feature_id": feature.id,
                "role_id": role_id,
            }
        }
    )
    
    if not existing:
        return {
            "message": "Feature is already at default value",
            "role_id": role_id,
            "feature_key": feature_key,
        }
    
    # Get default value
    default_value = DEFAULT_FEATURE_VISIBILITY.get(role.role_name, {}).get(feature_key, False)
    old_value = existing.is_visible
    
    # Delete override
    await db.categoryfeaturepermission.delete(where={"id": existing.id})
    
    # Create audit log
    await db.featureauditlog.create(
        data={
            "feature_id": feature.id,
            "role_id": role_id,
            "feature_key": feature_key,
            "feature_name": feature.feature_name,
            "old_value": old_value,
            "new_value": default_value,
            "changed_by": superadmin_user_id,
            "reason": "Reset to code default",
        }
    )
    
    # Invalidate cache
    cache = get_feature_cache()
    cache.invalidate(role_id)
    
    return {
        "message": "Feature visibility reset to default",
        "role_id": role_id,
        "feature_key": feature_key,
        "default_value": default_value,
    }


@router.delete("/roles/{role_id}/features")
async def reset_all_feature_visibility(
    role_id: int,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """Reset all feature visibilities for a role back to defaults."""
    role = await db.role.find_unique(where={"id": role_id})
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {role_id} not found"
        )
    
    # Get all overrides for this role
    overrides = await db.categoryfeaturepermission.find_many(
        where={"role_id": role_id},
        include={"feature": True},
    )
    
    if not overrides:
        return {
            "message": "All features are already at default values",
            "role_id": role_id,
        }
    
    defaults = DEFAULT_FEATURE_VISIBILITY.get(role.role_name, {})
    
    # Create audit logs and delete overrides
    for override in overrides:
        default_value = defaults.get(override.feature.feature_key, False)
        
        await db.featureauditlog.create(
            data={
                "feature_id": override.feature_id,
                "role_id": role_id,
                "feature_key": override.feature.feature_key,
                "feature_name": override.feature.feature_name,
                "old_value": override.is_visible,
                "new_value": default_value,
                "changed_by": superadmin_user_id,
                "reason": "Reset all features to defaults",
            }
        )
        
        await db.categoryfeaturepermission.delete(where={"id": override.id})
    
    # Invalidate cache
    cache = get_feature_cache()
    cache.invalidate(role_id)
    
    return {
        "message": f"Reset {len(overrides)} features to defaults",
        "role_id": role_id,
        "role_name": role.role_name,
    }


# Add logging
import logging
logger = logging.getLogger(__name__)
