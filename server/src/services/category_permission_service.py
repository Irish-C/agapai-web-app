"""
Category Permission Service
Manages visibility and function permissions for settings categories per role.
"""

from typing import List, Dict, Optional
from datetime import datetime
from database import db


class CategoryPermissionService:
    """Service for managing category-based permissions."""
    
    @staticmethod
    async def initialize_default_categories():
        """
        Initialize default settings categories.
        Called during system setup.
        """
        default_categories = [
            {
                "category_key": "my_account",
                "category_name": "My Account",
                "description": "User account settings and preferences",
                "icon_class": "FaUserCog",
                "sort_order": 0,
            },
            {
                "category_key": "notifications",
                "category_name": "Notifications",
                "description": "Email and alert notification settings",
                "icon_class": "FaBell",
                "sort_order": 1,
            },
            {
                "category_key": "device_location",
                "category_name": "Device and Location",
                "description": "Manage devices (cameras) and locations",
                "icon_class": "FaConnectdevelop",
                "sort_order": 2,
            },
            {
                "category_key": "user_management",
                "category_name": "User Management",
                "description": "Create and manage system users",
                "icon_class": "FaUsers",
                "sort_order": 3,
            },
            {
                "category_key": "permissions",
                "category_name": "Role Permissions",
                "description": "Configure role-based permissions and access control",
                "icon_class": "FaLock",
                "sort_order": 4,
            },
            {
                "category_key": "audit_log",
                "category_name": "Audit Log",
                "description": "View system activity and permission change history",
                "icon_class": "FaHistory",
                "sort_order": 5,
            },
        ]
        
        created = []
        for cat_data in default_categories:
            # Check if already exists
            existing = await db.settingscategory.find_unique(
                where={"category_key": cat_data["category_key"]}
            )
            
            if not existing:
                created_cat = await db.settingscategory.create(data=cat_data)
                created.append(created_cat)
        
        return created
    
    @staticmethod
    async def initialize_role_categories(role_id: int, created_by: int):
        """
        Initialize default category permissions for a role.
        Called when a new role is created.
        """
        # Get all categories
        categories = await db.settingscategory.find_many(
            order={"sort_order": "asc"}
        )
        
        # Define default visibility per role
        default_visibility = {
            "superadmin": {
                "my_account": {"visible": True, "functions": ["read", "write"]},
                "notifications": {"visible": True, "functions": ["read", "write"]},
                "device_location": {"visible": True, "functions": ["read", "write", "delete"]},
                "user_management": {"visible": True, "functions": ["read", "write", "delete"]},
                "permissions": {"visible": True, "functions": ["read", "write"]},
                "audit_log": {"visible": True, "functions": ["read"]},
            },
            "admin": {
                "my_account": {"visible": True, "functions": ["read", "write"]},
                "notifications": {"visible": True, "functions": ["read", "write"]},
                "device_location": {"visible": True, "functions": ["read", "write", "delete"]},
                "user_management": {"visible": True, "functions": ["read", "write"]},
                "permissions": {"visible": False, "functions": []},
                "audit_log": {"visible": False, "functions": []},
            },
            "user": {
                "my_account": {"visible": True, "functions": ["read", "write"]},
                "notifications": {"visible": True, "functions": ["read", "write"]},
                "device_location": {"visible": False, "functions": []},
                "user_management": {"visible": False, "functions": []},
                "permissions": {"visible": False, "functions": []},
                "audit_log": {"visible": False, "functions": []},
            },
        }
        
        # Get the role
        role = await db.role.find_unique(where={"id": role_id})
        if not role:
            raise ValueError(f"Role {role_id} not found")
        
        role_name = role.role_name.lower()
        role_config = default_visibility.get(role_name, default_visibility["user"])
        
        created = []
        for category in categories:
            cat_key = category.category_key
            config = role_config.get(cat_key, {"visible": False, "functions": []})
            
            cat_perm_data = {
                "category_id": category.id,
                "role_id": role_id,
                "is_visible": config["visible"],
                "allowed_functions": config["functions"],
                "created_by": created_by,
            }
            
            created_perm = await db.categorypermission.create(data=cat_perm_data)
            created.append(created_perm)
        
        return created
    
    @staticmethod
    async def get_category_permissions(role_id: int) -> Dict:
        """
        Get all category permissions for a role.
        Returns a dict mapping category_key to permission settings.
        """
        # Get all permissions with category details
        permissions = await db.categorypermission.find_many(
            where={"role_id": role_id},
            include={"category": True},
        )
        
        result = {}
        for perm in permissions:
            result[perm.category.category_key] = {
                "category_id": perm.category_id,
                "category_name": perm.category.category_name,
                "description": perm.category.description,
                "icon_class": perm.category.icon_class,
                "is_visible": perm.is_visible,
                "allowed_functions": perm.allowed_functions or [],
            }
        
        return result
    
    @staticmethod
    async def get_visible_categories(role_id: int) -> List[Dict]:
        """
        Get only visible categories for a role.
        Used on the frontend to filter which tabs to show.
        """
        permissions = await db.categorypermission.find_many(
            where={"role_id": role_id, "is_visible": True},
            include={"category": True},
            order={"category": {"sort_order": "asc"}},
        )
        
        result = []
        for perm in permissions:
            result.append({
                "category_key": perm.category.category_key,
                "category_name": perm.category.category_name,
                "icon_class": perm.category.icon_class,
                "functions": perm.allowed_functions or [],
            })
        
        return result
    
    @staticmethod
    async def check_category_access(role_id: int, category_key: str) -> bool:
        """
        Check if a role has access to a specific category.
        """
        # Get category
        category = await db.settingscategory.find_unique(
            where={"category_key": category_key}
        )
        
        if not category:
            return False
        
        # Get permission
        perm = await db.categorypermission.find_unique(
            where={"category_id_role_id": {"category_id": category.id, "role_id": role_id}}
        )
        
        return perm and perm.is_visible if perm else False
    
    @staticmethod
    async def check_function_access(
        role_id: int,
        category_key: str,
        function: str
    ) -> bool:
        """
        Check if a role has access to a specific function in a category.
        Functions: read, write, delete
        """
        # Get category
        category = await db.settingscategory.find_unique(
            where={"category_key": category_key}
        )
        
        if not category:
            return False
        
        # Get permission
        perm = await db.categorypermission.find_unique(
            where={"category_id_role_id": {"category_id": category.id, "role_id": role_id}}
        )
        
        if not perm or not perm.is_visible:
            return False
        
        allowed_functions = perm.allowed_functions or []
        return function in allowed_functions
    
    @staticmethod
    async def update_category_permission(
        role_id: int,
        category_key: str,
        is_visible: bool,
        allowed_functions: List[str],
        created_by: int,
        reason: Optional[str] = None
    ) -> Dict:
        """
        Update a category permission for a role.
        """
        # Get category
        category = await db.settingscategory.find_unique(
            where={"category_key": category_key}
        )
        
        if not category:
            raise ValueError(f"Category {category_key} not found")
        
        # Get current permission
        current_perm = await db.categorypermission.find_unique(
            where={"category_id_role_id": {"category_id": category.id, "role_id": role_id}}
        )
        
        if not current_perm:
            raise ValueError(
                f"No permission found for role {role_id} and category {category_key}"
            )
        
        # Update
        updated_perm = await db.categorypermission.update(
            where={"id": current_perm.id},
            data={
                "is_visible": is_visible,
                "allowed_functions": allowed_functions,
                "created_by": created_by,
                "updated_at": datetime.now(),
            }
        )
        
        return {
            "category_key": category_key,
            "category_name": category.category_name,
            "is_visible": updated_perm.is_visible,
            "allowed_functions": updated_perm.allowed_functions,
        }
    
    @staticmethod
    async def reset_category_permissions(role_id: int, created_by: int):
        """
        Reset all category permissions for a role to defaults.
        """
        # Delete all current permissions
        await db.categorypermission.delete_many(where={"role_id": role_id})
        
        # Recreate defaults
        return await CategoryPermissionService.initialize_role_categories(
            role_id, created_by
        )
