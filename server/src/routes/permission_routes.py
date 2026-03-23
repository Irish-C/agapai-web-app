"""
Permission Management API Endpoints
SuperAdmin-only endpoints for managing role permissions at runtime.
All changes are audit logged with optimistic locking support.
"""

from datetime import datetime
from typing import List, Dict, Optional
from enum import Enum
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, validator

from database import db
from src.utils.auth import require_superadmin_user_id
from src.services.permission_service import (
    get_permission_cache,
    get_permission_checker,
)
from src.services.permission_broadcast import get_broadcaster
from src.services.category_permission_service import CategoryPermissionService
from src.utils.permission_constants import ALL_PERMISSIONS, DEFAULT_PERMISSIONS

router = APIRouter(prefix="/api/admin/permissions", tags=["permissions"])

# ============================================================================
# Enums & Constants
# ============================================================================

class AllowedFunctionEnum(str, Enum):
    """Valid category permission functions."""
    READ = "read"
    WRITE = "write"
    DELETE = "delete"

# Map of category keys to allowed functions
CATEGORY_FUNCTION_MAP = {
    "my_account": [AllowedFunctionEnum.READ, AllowedFunctionEnum.WRITE],
    "notifications": [AllowedFunctionEnum.READ, AllowedFunctionEnum.WRITE],
    "device_location": [AllowedFunctionEnum.READ, AllowedFunctionEnum.WRITE, AllowedFunctionEnum.DELETE],
    "user_management": [AllowedFunctionEnum.READ, AllowedFunctionEnum.WRITE, AllowedFunctionEnum.DELETE],
    "permissions": [AllowedFunctionEnum.READ, AllowedFunctionEnum.WRITE],
    "category_permissions": [AllowedFunctionEnum.READ, AllowedFunctionEnum.WRITE],
    "audit_log": [AllowedFunctionEnum.READ],
}


# ============================================================================
# Pydantic Models
# ============================================================================

class PermissionResponse(BaseModel):
    """Response model for a single permission."""
    permission_name: str
    is_granted: bool
    
    class Config:
        from_attributes = True


class RolePermissionsResponse(BaseModel):
    """Response model for all permissions of a role."""
    role_id: int
    role_name: str
    permissions: Dict[str, bool]
    

class BulkPermissionUpdateRequest(BaseModel):
    """Request model for bulk permission updates."""
    permissions: Dict[str, bool]
    reason: Optional[str] = "Updated via admin panel"


class SinglePermissionUpdateRequest(BaseModel):
    """Request model for single permission update with optimistic locking."""
    is_granted: bool
    version: Optional[int] = None  # For optimistic locking - optional for backward compat
    reason: Optional[str] = "Updated via admin panel"


class AuditLogResponse(BaseModel):
    """Response model for permission change audit log."""
    id: str  # BigInt - serialize as string
    role_id: str  # BigInt - serialize as string
    role_name: str
    permission_name: str
    old_value: Optional[bool]
    new_value: bool
    changed_by: str  # BigInt - serialize as string
    changed_by_username: str
    changed_at: datetime
    reason: Optional[str]
    
    class Config:
        from_attributes = True


# ============================================================================
# Category Permission Models
# ============================================================================

class CategoryPermissionDetail(BaseModel):
    """Details of a category permission."""
    category_id: int
    category_name: str
    category_key: str
    description: Optional[str]
    icon_class: Optional[str]
    is_visible: bool
    allowed_functions: List[str]
    
    class Config:
        from_attributes = True


class RoleCategoryPermissionsResponse(BaseModel):
    """Response model for all category permissions of a role."""
    role_id: int
    role_name: str
    categories: Dict[str, CategoryPermissionDetail]


class UpdateCategoryPermissionRequest(BaseModel):
    """Request model for updating a category permission."""
    is_visible: bool
    allowed_functions: List[str]  # e.g., ["read", "write", "delete"]
    version: Optional[int] = None  # For optimistic locking
    reason: Optional[str] = "Updated via admin panel"
    
    @validator('allowed_functions')
    def validate_functions(cls, v):
        """Validate that allowed_functions only contains valid values."""
        valid_functions = {e.value for e in AllowedFunctionEnum}
        for func in v:
            if func not in valid_functions:
                raise ValueError(f"Invalid function '{func}'. Must be one of: {', '.join(valid_functions)}")
        return v


class CopyRolePermissionsRequest(BaseModel):
    """Request model for copying role permissions."""
    source_role_id: int
    reason: Optional[str] = "Copied from another role"


class UndoPermissionChangeRequest(BaseModel):
    """Request model for undoing a permission change."""
    audit_log_id: str  # ID of the change to undo
    reason: Optional[str] = "Undo previous change"


class RoleTemplateResponse(BaseModel):
    """Response model for role templates."""
    template_name: str
    description: str
    base_role_id: int
    base_role_name: str
    permissions: Dict[str, bool]
    
    class Config:
        from_attributes = True


class VisibleCategoryResponse(BaseModel):
    """Response model for visible categories for a role."""
    category_key: str
    category_name: str
    icon_class: Optional[str]
    functions: List[str]


# ============================================================================
# GET Endpoints
# ============================================================================

@router.get("/roles/{role_id}", response_model=RolePermissionsResponse)
async def get_role_permissions(
    role_id: int,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
) -> RolePermissionsResponse:
    """
    Get all permissions for a specific role.
    Shows merged defaults + any database overrides.
    """
    # Verify role exists
    role = await db.role.find_unique(where={"id": role_id})
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    # Get permissions
    cache = get_permission_cache()
    permissions = await cache.get_permissions(role_id)
    
    return RolePermissionsResponse(
        role_id=role_id,
        role_name=role.role_name,
        permissions=permissions
    )


@router.get("/roles", response_model=List[RolePermissionsResponse])
async def get_all_roles_permissions(
    superadmin_user_id: int = Depends(require_superadmin_user_id),
) -> List[RolePermissionsResponse]:
    """
    Get all permissions for all roles.
    Useful for permission matrix view.
    """
    # Get all roles
    roles = await db.role.find_many()
    
    cache = get_permission_cache()
    response = []
    
    for role in roles:
        permissions = await cache.get_permissions(role.id)
        response.append(
            RolePermissionsResponse(
                role_id=role.id,
                role_name=role.role_name,
                permissions=permissions
            )
        )
    
    return response


@router.get("/audit-log", response_model=List[AuditLogResponse])
async def get_permission_audit_log(
    role_id: Optional[int] = None,
    permission_name: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
) -> List[AuditLogResponse]:
    """
    Get permission change audit log.
    Shows who changed what permissions and when.
    
    Query params:
    - role_id: Filter by specific role (optional)
    - permission_name: Filter by permission name (optional)
    - limit: Max results to return (default 100)
    - offset: Pagination offset (default 0)
    """
    try:
        # Build query
        where_clause = {}
        if role_id is not None:
            where_clause["role_id"] = int(role_id)
        if permission_name is not None:
            where_clause["permission_name"] = permission_name
        
        # Fetch audit logs using lowercase model name
        logs = await db.permissionauditlog.find_many(
            where=where_clause,
            order={'changed_at': 'desc'},
            take=limit,
            skip=offset,
        )
        
        # Enrich with user and role names
        response = []
        for log in logs:
            # Get changed_by user
            user = await db.user.find_unique(where={"id": log.changed_by})
            
            # Get role
            role = await db.role.find_unique(where={"id": log.role_id})
            
            response.append(
                AuditLogResponse(
                    id=str(log.id),
                    role_id=str(log.role_id),
                    role_name=role.role_name if role else "Unknown",
                    permission_name=log.permission_name,
                    old_value=log.old_value,
                    new_value=log.new_value,
                    changed_by=str(log.changed_by),
                    changed_by_username=user.username if user else "Unknown",
                    changed_at=log.changed_at,
                    reason=log.reason,
                )
            )
        
        return response
    except Exception as e:
        print(f"[ERROR] Failed to fetch audit logs: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch audit logs: {str(e)}"
        )


# ============================================================================
# UPDATE Endpoints
# ============================================================================

@router.put("/roles/{role_id}/permissions/{permission_name}")
async def update_single_permission(
    role_id: int,
    permission_name: str,
    request: SinglePermissionUpdateRequest,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Update a single permission for a role.
    Creates audit log entry automatically.
    """
    # Validate permission name
    if permission_name not in ALL_PERMISSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid permission: {permission_name}"
        )
    
    # Verify role exists
    role = await db.role.find_unique(where={"id": role_id})
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    # Get superadmin user for logging
    superadmin_user = await db.user.find_unique(where={"id": superadmin_user_id})
    
    # Get current permission state
    existing = await db.rolepermission.find_unique(
        where={
            "role_id_permission_name": {
                "role_id": role_id,
                "permission_name": permission_name,
            }
        }
    )
    
    old_value = existing.is_granted if existing else DEFAULT_PERMISSIONS.get(role.role_name, {}).get(permission_name)
    
    # Skip if no change
    if old_value == request.is_granted:
        return {
            "message": "No change",
            "role_id": role_id,
            "permission_name": permission_name,
            "is_granted": request.is_granted
        }
    
    # Update or create permission record
    if existing:
        await db.rolepermission.update(
            where={
                "role_id_permission_name": {
                    "role_id": role_id,
                    "permission_name": permission_name,
                }
            },
            data={
                "is_granted": request.is_granted,
                "updated_at": datetime.utcnow(),
            }
        )
    else:
        await db.rolepermission.create(
            data={
                "role_id": role_id,
                "permission_name": permission_name,
                "is_granted": request.is_granted,
                "created_by": superadmin_user_id,
            }
        )
    
    # Create audit log
    await db.permissionauditlog.create(
        data={
            "role_id": role_id,
            "permission_name": permission_name,
            "old_value": old_value,
            "new_value": request.is_granted,
            "changed_by": superadmin_user_id,
            "reason": request.reason,
        }
    )
    
    # Invalidate cache
    cache = get_permission_cache()
    cache.invalidate(role_id)
    
    # Broadcast update to connected clients
    broadcaster = get_broadcaster()
    if broadcaster:
        await broadcaster.broadcast_permission_update(
            role_id=role_id,
            role_name=role.role_name,
            permission_name=permission_name,
            old_value=old_value,
            new_value=request.is_granted,
            changed_by_username=superadmin_user.username if superadmin_user else "System",
            reason=request.reason,
        )
    
    return {
        "message": "Permission updated successfully",
        "role_id": role_id,
        "permission_name": permission_name,
        "old_value": old_value,
        "new_value": request.is_granted,
    }


@router.put("/roles/{role_id}/permissions")
async def update_bulk_permissions(
    role_id: int,
    request: BulkPermissionUpdateRequest,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Update multiple permissions for a role in one request.
    More efficient than multiple single-permission updates.
    """
    # Validate role exists
    role = await db.role.find_unique(where={"id": role_id})
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    # Get superadmin user for logging
    superadmin_user = await db.user.find_unique(where={"id": superadmin_user_id})
    
    # Validate all permission names
    invalid_perms = [p for p in request.permissions.keys() if p not in ALL_PERMISSIONS]
    if invalid_perms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid permissions: {', '.join(invalid_perms)}"
        )
    
    changes = []
    
    # Process each permission update
    for permission_name, is_granted in request.permissions.items():
        existing = await db.rolepermission.find_unique(
            where={
                "role_id_permission_name": {
                    "role_id": role_id,
                    "permission_name": permission_name,
                }
            }
        )
        
        old_value = existing.is_granted if existing else DEFAULT_PERMISSIONS.get(role.role_name, {}).get(permission_name)
        
        # Skip if no change
        if old_value == is_granted:
            continue
        
        # Update or create
        if existing:
            await db.rolepermission.update(
                where={
                    "role_id_permission_name": {
                        "role_id": role_id,
                        "permission_name": permission_name,
                    }
                },
                data={
                    "is_granted": is_granted,
                    "updated_at": datetime.utcnow(),
                }
            )
        else:
            await db.rolepermission.create(
                data={
                    "role_id": role_id,
                    "permission_name": permission_name,
                    "is_granted": is_granted,
                    "created_by": superadmin_user_id,
                }
            )
        
        # Create audit log
        await db.permissionauditlog.create(
            data={
                "role_id": role_id,
                "permission_name": permission_name,
                "old_value": old_value,
                "new_value": is_granted,
                "changed_by": superadmin_user_id,
                "reason": request.reason,
            }
        )
        
        changes.append({
            "permission_name": permission_name,
            "old_value": old_value,
            "new_value": is_granted,
        })
    
    if changes:
        # Invalidate cache
        cache = get_permission_cache()
        cache.invalidate(role_id)
        
        # Broadcast bulk update to connected clients
        broadcaster = get_broadcaster()
        if broadcaster:
            await broadcaster.broadcast_bulk_permission_update(
                role_id=role_id,
                role_name=role.role_name,
                update_count=len(changes),
                changed_by_username=superadmin_user.username if superadmin_user else "System",
                reason=request.reason,
            )
    
    return {
        "message": f"Updated {len(changes)} permissions",
        "role_id": role_id,
        "changes": changes,
    }


# ============================================================================
# RESET Endpoints
# ============================================================================

@router.delete("/roles/{role_id}/permissions/{permission_name}")
async def reset_single_permission(
    role_id: int,
    permission_name: str,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Reset a single permission back to its code-defined default.
    This deletes the override from the database.
    """
    # Validate permission name
    if permission_name not in ALL_PERMISSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid permission: {permission_name}"
        )
    
    # Verify role exists
    role = await db.role.find_unique(where={"id": role_id})
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    # Find and check existing override
    existing = await db.rolepermission.find_unique(
        where={
            "role_id_permission_name": {
                "role_id": role_id,
                "permission_name": permission_name,
            }
        }
    )
    
    if not existing:
        return {
            "message": "Permission is already at default value",
            "role_id": role_id,
            "permission_name": permission_name,
        }
    
    # Get default value
    default_value = DEFAULT_PERMISSIONS.get(role.role_name, {}).get(permission_name, False)
    old_value = existing.is_granted
    
    # Delete override
    await db.rolepermission.delete(
        where={
            "role_id_permission_name": {
                "role_id": role_id,
                "permission_name": permission_name,
            }
        }
    )
    
    # Create audit log for reset
    await db.permissionauditlog.create(
        data={
            "role_id": role_id,
            "permission_name": permission_name,
            "old_value": old_value,
            "new_value": default_value,
            "changed_by": superadmin_user_id,
            "reason": "Reset to code default",
        }
    )
    
    # Invalidate cache
    cache = get_permission_cache()
    cache.invalidate(role_id)
    
    return {
        "message": "Permission reset to default",
        "role_id": role_id,
        "permission_name": permission_name,
        "default_value": default_value,
    }


@router.delete("/roles/{role_id}/permissions")
async def reset_all_permissions(
    role_id: int,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Reset all permissions for a role back to code-defined defaults.
    Deletes all override records from the database.
    """
    # Verify role exists
    role = await db.role.find_unique(where={"id": role_id})
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    # Get superadmin user for logging
    superadmin_user = await db.user.find_unique(where={"id": superadmin_user_id})
    
    # Get all overrides for this role
    overrides = await db.rolepermission.find_many(
        where={"role_id": role_id}
    )
    
    if not overrides:
        return {
            "message": "All permissions are already at default values",
            "role_id": role_id,
        }
    
    # Create audit logs for each reset
    defaults = DEFAULT_PERMISSIONS.get(role.role_name, {})
    for override in overrides:
        default_value = defaults.get(override.permission_name, False)
        
        await db.permissionauditlog.create(
            data={
                "role_id": role_id,
                "permission_name": override.permission_name,
                "old_value": override.is_granted,
                "new_value": default_value,
                "changed_by": superadmin_user_id,
                "reason": "Reset all permissions to code defaults",
            }
        )
    
    # Delete all overrides
    await db.rolepermission.delete_many(
        where={"role_id": role_id}
    )
    
    # Invalidate cache
    cache = get_permission_cache()
    cache.invalidate(role_id)
    
    # Broadcast reset to connected clients
    broadcaster = get_broadcaster()
    if broadcaster:
        await broadcaster.broadcast_permission_reset(
            role_id=role_id,
            role_name=role.role_name,
            reset_count=len(overrides),
            changed_by_username=superadmin_user.username if superadmin_user else "System",
        )
    
    return {
        "message": f"Reset {len(overrides)} permissions to defaults",
        "role_id": role_id,
    }


# ============================================================================
# CATEGORY PERMISSION Endpoints
# ============================================================================

@router.get("/categories", response_model=List[Dict])
async def get_all_categories(
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Get all available settings categories.
    Superadmin only.
    """
    try:
        categories = await db.settingscategory.find_many(
            order={"sort_order": "asc"},
            where={"is_active": True},
        )
        
        return [
            {
                "id": cat.id,
                "category_key": cat.category_key,
                "category_name": cat.category_name,
                "description": cat.description,
                "icon_class": cat.icon_class,
                "sort_order": cat.sort_order,
            }
            for cat in categories
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch categories: {str(e)}"
        )


@router.get("/categories/{role_id}", response_model=RoleCategoryPermissionsResponse)
async def get_role_category_permissions(
    role_id: int,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Get all category permissions for a specific role.
    Shows which settings tabs are visible and what functions are allowed.
    """
    try:
        # Verify role exists
        role = await db.role.find_unique(where={"id": role_id})
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with id {role_id} not found"
            )
        
        # Get category permissions
        cat_perms = await CategoryPermissionService.get_category_permissions(role_id)
        
        # Format response
        categories = {}
        for cat_key, perm_data in cat_perms.items():
            categories[cat_key] = CategoryPermissionDetail(
                category_id=perm_data["category_id"],
                category_name=perm_data["category_name"],
                category_key=cat_key,
                description=perm_data.get("description"),
                icon_class=perm_data.get("icon_class"),
                is_visible=perm_data["is_visible"],
                allowed_functions=perm_data["allowed_functions"],
            )
        
        return RoleCategoryPermissionsResponse(
            role_id=role_id,
            role_name=role.role_name,
            categories=categories,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch category permissions: {str(e)}"
        )


@router.get("/categories/{role_id}/visible", response_model=List[VisibleCategoryResponse])
async def get_visible_categories(
    role_id: int,
):
    """
    Get only visible settings categories for a role.
    Public endpoint for frontend to determine which tabs to show.
    """
    try:
        visible_cats = await CategoryPermissionService.get_visible_categories(role_id)
        return visible_cats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch visible categories: {str(e)}"
        )


@router.put("/categories/{role_id}/{category_key}", response_model=Dict)
async def update_category_permission(
    role_id: int,
    category_key: str,
    request: UpdateCategoryPermissionRequest,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Update visibility and allowed functions for a category in a role.
    Superadmin only.
    """
    try:
        # Verify role exists
        role = await db.role.find_unique(where={"id": role_id})
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with id {role_id} not found"
            )
        
        # Update permission
        result = await CategoryPermissionService.update_category_permission(
            role_id=role_id,
            category_key=category_key,
            is_visible=request.is_visible,
            allowed_functions=request.allowed_functions,
            created_by=superadmin_user_id,
            reason=request.reason,
        )
        
        # Invalidate any permission cache if needed
        cache = get_permission_cache()
        if hasattr(cache, 'invalidate'):
            cache.invalidate(role_id)
        
        return {
            "message": "Category permission updated successfully",
            "role_id": role_id,
            "role_name": role.role_name,
            "result": result,
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update category permission: {str(e)}"
        )


@router.post("/categories/{role_id}/bulk-update", response_model=Dict)
async def bulk_update_category_permissions(
    role_id: int,
    request: Dict[str, UpdateCategoryPermissionRequest],
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Update multiple category permissions for a role in one request.
    More efficient than individual updates.
    
    Request body should be:
    {
        "category_key_1": {"is_visible": true, "allowed_functions": ["read", "write"]},
        "category_key_2": {"is_visible": false, "allowed_functions": []},
        ...
    }
    """
    try:
        # Verify role exists
        role = await db.role.find_unique(where={"id": role_id})
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with id {role_id} not found"
            )
        
        updates = []
        errors = []
        
        for category_key, perm_request in request.items():
            try:
                result = await CategoryPermissionService.update_category_permission(
                    role_id=role_id,
                    category_key=category_key,
                    is_visible=perm_request.is_visible,
                    allowed_functions=perm_request.allowed_functions,
                    created_by=superadmin_user_id,
                    reason=perm_request.reason,
                )
                updates.append(result)
            except ValueError as e:
                errors.append({"category_key": category_key, "error": str(e)})
        
        # Invalidate cache
        cache = get_permission_cache()
        if hasattr(cache, 'invalidate'):
            cache.invalidate(role_id)
        
        return {
            "message": f"Updated {len(updates)} category permissions",
            "role_id": role_id,
            "role_name": role.role_name,
            "updates": updates,
            "errors": errors,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to bulk update category permissions: {str(e)}"
        )


@router.delete("/categories/{role_id}")
async def reset_category_permissions(
    role_id: int,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Reset all category permissions for a role to defaults.
    Superadmin only.
    """
    try:
        # Verify role exists
        role = await db.role.find_unique(where={"id": role_id})
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Role with id {role_id} not found"
            )
        
        # Reset permissions
        await CategoryPermissionService.reset_category_permissions(
            role_id=role_id,
            created_by=superadmin_user_id,
        )
        
        # Invalidate cache
        cache = get_permission_cache()
        if hasattr(cache, 'invalidate'):
            cache.invalidate(role_id)
        
        return {
            "message": "Category permissions reset to defaults",
            "role_id": role_id,
            "role_name": role.role_name,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset category permissions: {str(e)}"
        )


# ============================================================================
# ROLE TEMPLATES & ADVANCED FEATURES
# ============================================================================

@router.post("/roles/{target_role_id}/copy-from/{source_role_id}", response_model=Dict)
async def copy_role_permissions(
    target_role_id: int,
    source_role_id: int,
    request: CopyRolePermissionsRequest,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Copy all permissions from one role to another.
    Useful for creating templates and maintaining consistency.
    Creates audit logs for all changes.
    """
    # Verify both roles exist
    source_role = await db.role.find_unique(where={"id": source_role_id})
    target_role = await db.role.find_unique(where={"id": target_role_id})
    
    if not source_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Source role with id {source_role_id} not found"
        )
    
    if not target_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target role with id {target_role_id} not found"
        )
    
    if source_role_id == target_role_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source and target roles must be different"
        )
    
    # Get source permissions with eager loading
    source_perms = await db.rolepermission.find_many(
        where={"role_id": source_role_id}
    )
    
    # Get target's current permissions
    target_perms_map = {}
    existing_targets = await db.rolepermission.find_many(
        where={"role_id": target_role_id}
    )
    for tp in existing_targets:
        target_perms_map[tp.permission_name] = tp
    
    changes = []
    
    # Copy permissions
    for src_perm in source_perms:
        existing_target = target_perms_map.get(src_perm.permission_name)
        old_value = existing_target.is_granted if existing_target else DEFAULT_PERMISSIONS.get(
            target_role.role_name, {}
        ).get(src_perm.permission_name, False)
        
        if existing_target:
            await db.rolepermission.update(
                where={"id": existing_target.id},
                data={
                    "is_granted": src_perm.is_granted,
                    "updated_at": datetime.utcnow(),
                }
            )
        else:
            await db.rolepermission.create(
                data={
                    "role_id": target_role_id,
                    "permission_name": src_perm.permission_name,
                    "is_granted": src_perm.is_granted,
                    "created_by": superadmin_user_id,
                }
            )
        
        # Create audit log
        if old_value != src_perm.is_granted:
            await db.permissionauditlog.create(
                data={
                    "role_id": target_role_id,
                    "permission_name": src_perm.permission_name,
                    "old_value": old_value,
                    "new_value": src_perm.is_granted,
                    "changed_by": superadmin_user_id,
                    "reason": f"Copied from {source_role.role_name}: {request.reason}",
                }
            )
            
            changes.append({
                "permission_name": src_perm.permission_name,
                "old_value": old_value,
                "new_value": src_perm.is_granted,
            })
    
    # Invalidate cache
    cache = get_permission_cache()
    cache.invalidate(target_role_id)
    
    # Broadcast update
    broadcaster = get_broadcaster()
    if broadcaster and changes:
        await broadcaster.broadcast_bulk_permission_update(
            role_id=target_role_id,
            role_name=target_role.role_name,
            update_count=len(changes),
            changed_by_username=(await db.user.find_unique(where={"id": superadmin_user_id})).username,
            reason=request.reason,
        )
    
    return {
        "message": f"Copied {len(changes)} permissions from {source_role.role_name} to {target_role.role_name}",
        "source_role_id": source_role_id,
        "target_role_id": target_role_id,
        "changes": changes,
    }


@router.post("/audit-log/{audit_log_id}/undo", response_model=Dict)
async def undo_permission_change(
    audit_log_id: str,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Undo a previous permission change by reverting to its old value.
    Creates a new audit log entry for the undo action.
    """
    try:
        audit_log_id_int = int(audit_log_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid audit log ID format"
        )
    
    # Get the audit log entry
    audit_log = await db.permissionauditlog.find_unique(
        where={"id": audit_log_id_int}
    )
    
    if not audit_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit log entry {audit_log_id} not found"
        )
    
    if audit_log.old_value is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot undo initial permission creation (no old value)"
        )
    
    # Get role and verify it exists
    role = await db.role.find_unique(where={"id": audit_log.role_id})
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role {audit_log.role_id} not found"
        )
    
    # Find or create permission record
    existing = await db.rolepermission.find_unique(
        where={
            "role_id_permission_name": {
                "role_id": audit_log.role_id,
                "permission_name": audit_log.permission_name,
            }
        }
    )
    
    # Undo by setting permission back to old_value
    if existing:
        await db.rolepermission.update(
            where={"id": existing.id},
            data={
                "is_granted": audit_log.old_value,
                "updated_at": datetime.utcnow(),
            }
        )
    else:
        await db.rolepermission.create(
            data={
                "role_id": audit_log.role_id,
                "permission_name": audit_log.permission_name,
                "is_granted": audit_log.old_value,
                "created_by": superadmin_user_id,
            }
        )
    
    # Create new audit log for the undo
    await db.permissionauditlog.create(
        data={
            "role_id": audit_log.role_id,
            "permission_name": audit_log.permission_name,
            "old_value": audit_log.new_value,  # Current value
            "new_value": audit_log.old_value,  # Reverting to old
            "changed_by": superadmin_user_id,
            "reason": f"Undo of change #{audit_log_id}: reverted to {audit_log.old_value}",
        }
    )
    
    # Invalidate cache
    cache = get_permission_cache()
    cache.invalidate(audit_log.role_id)
    
    # Broadcast update
    superadmin_user = await db.user.find_unique(where={"id": superadmin_user_id})
    broadcaster = get_broadcaster()
    if broadcaster:
        await broadcaster.broadcast_permission_update(
            role_id=audit_log.role_id,
            role_name=role.role_name,
            permission_name=audit_log.permission_name,
            old_value=audit_log.new_value,
            new_value=audit_log.old_value,
            changed_by_username=superadmin_user.username if superadmin_user else "System",
            reason=f"Undo of change #{audit_log_id}",
        )
    
    return {
        "message": f"Undone change {audit_log_id}",
        "role_id": audit_log.role_id,
        "role_name": role.role_name,
        "permission_name": audit_log.permission_name,
        "reverted_to": audit_log.old_value,
    }


@router.get("/roles/{role_id}/with-version", response_model=Dict)
async def get_role_permissions_with_versions(
    role_id: int,
    superadmin_user_id: int = Depends(require_superadmin_user_id),
):
    """
    Get all permissions for a role along with their version numbers.
    Used for optimistic locking validation in update operations.
    """
    # Verify role exists
    role = await db.role.find_unique(where={"id": role_id})
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Role with id {role_id} not found"
        )
    
    # Get all permissions with versions
    perms = await db.rolepermission.find_many(
        where={"role_id": role_id}
    )
    
    perms_with_versions = {}
    for perm in perms:
        perms_with_versions[perm.permission_name] = {
            "is_granted": perm.is_granted,
            "version": perm.version,
        }
    
    return {
        "role_id": role_id,
        "role_name": role.role_name,
        "permissions": perms_with_versions,
    }


