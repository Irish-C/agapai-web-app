"""
Feature definitions for category-based settings permissions (Option 2 - Feature-level).
Defines all available features per settings category and their default visibility per role.
"""

# Map of category_key -> list of features available in that category
CATEGORY_FEATURES = {
    "my_account": [
        {"feature_key": "view_profile", "feature_name": "View Profile", "description": "View own account profile"},
        {"feature_key": "edit_profile", "feature_name": "Edit Profile", "description": "Edit own profile information"},
        {"feature_key": "change_password", "feature_name": "Change Password", "description": "Change own password"},
    ],
    
    "notifications": [
        {"feature_key": "view_settings", "feature_name": "View Settings", "description": "View notification preferences"},
        {"feature_key": "configure_email", "feature_name": "Configure Email", "description": "Enable/disable email notifications"},
        {"feature_key": "configure_alerts", "feature_name": "Configure Alerts", "description": "Set alert thresholds"},
    ],
    
    "device_location": [
        {"feature_key": "view_cameras", "feature_name": "View Cameras", "description": "View camera list"},
        {"feature_key": "add_camera", "feature_name": "Add Camera", "description": "Add new camera"},
        {"feature_key": "edit_camera", "feature_name": "Edit Camera", "description": "Modify camera settings"},
        {"feature_key": "delete_camera", "feature_name": "Delete Camera", "description": "Remove camera"},
        {"feature_key": "view_locations", "feature_name": "View Locations", "description": "View location list"},
        {"feature_key": "add_location", "feature_name": "Add Location", "description": "Create new location"},
        {"feature_key": "edit_location", "feature_name": "Edit Location", "description": "Modify location"},
        {"feature_key": "delete_location", "feature_name": "Delete Location", "description": "Remove location"},
    ],
    
    "user_management": [
        {"feature_key": "view_users", "feature_name": "View Users", "description": "View user list"},
        {"feature_key": "create_user", "feature_name": "Create User", "description": "Add new user"},
        {"feature_key": "edit_user", "feature_name": "Edit User", "description": "Modify user information"},
        {"feature_key": "assign_role", "feature_name": "Assign Role", "description": "Change user role"},
        {"feature_key": "archive_user", "feature_name": "Archive/Restore User", "description": "Archive or restore user accounts"},
    ],
    
    "permissions": [
        {"feature_key": "view_permissions", "feature_name": "View Permissions", "description": "View role permissions matrix"},
        {"feature_key": "configure_permissions", "feature_name": "Configure Permissions", "description": "Modify role permissions"},
        {"feature_key": "view_audit_log", "feature_name": "View Permission Audit Log", "description": "View permission change history"},
    ],
    
    "category_permissions": [
        {"feature_key": "view_categories", "feature_name": "View Categories", "description": "View settings categories"},
        {"feature_key": "configure_categories", "feature_name": "Configure Categories", "description": "Control category visibility for roles"},
    ],
    
    "audit_log": [
        {"feature_key": "view_logs", "feature_name": "View Audit Logs", "description": "View system activity logs"},
        {"feature_key": "filter_logs", "feature_name": "Filter & Search", "description": "Filter logs by criteria"},
    ],
}

# Default visibility per role per feature
# Maps: role_name -> {feature_key -> is_visible}
DEFAULT_FEATURE_VISIBILITY = {
    "superadmin": {
        # My Account - all
        "view_profile": True,
        "edit_profile": True,
        "change_password": True,
        
        # Notifications - all
        "view_settings": True,
        "configure_email": True,
        "configure_alerts": True,
        
        # Device & Location - all
        "view_cameras": True,
        "add_camera": True,
        "edit_camera": True,
        "delete_camera": True,
        "view_locations": True,
        "add_location": True,
        "edit_location": True,
        "delete_location": True,
        
        # User Management - all
        "view_users": True,
        "create_user": True,
        "edit_user": True,
        "assign_role": True,
        "archive_user": True,
        
        # Permissions - all
        "view_permissions": True,
        "configure_permissions": True,
        "view_audit_log": True,
        
        # Categories - all
        "view_categories": True,
        "configure_categories": True,
        
        # Audit Log - all
        "view_logs": True,
        "filter_logs": True,
    },
    
    "admin": {
        # My Account - all
        "view_profile": True,
        "edit_profile": True,
        "change_password": True,
        
        # Notifications - all
        "view_settings": True,
        "configure_email": True,
        "configure_alerts": True,
        
        # Device & Location - all except delete
        "view_cameras": True,
        "add_camera": True,
        "edit_camera": True,
        "delete_camera": False,
        "view_locations": True,
        "add_location": True,
        "edit_location": True,
        "delete_location": False,
        
        # User Management - all except archive
        "view_users": True,
        "create_user": True,
        "edit_user": True,
        "assign_role": True,
        "archive_user": False,
        
        # Permissions - view only
        "view_permissions": True,
        "configure_permissions": False,
        "view_audit_log": True,
        
        # Categories - hidden
        "view_categories": False,
        "configure_categories": False,
        
        # Audit Log - hidden
        "view_logs": False,
        "filter_logs": False,
    },
    
    "supervisor": {
        # My Account - all
        "view_profile": True,
        "edit_profile": True,
        "change_password": True,
        
        # Notifications - all
        "view_settings": True,
        "configure_email": True,
        "configure_alerts": True,
        
        # Device & Location - view and edit only
        "view_cameras": True,
        "add_camera": True,
        "edit_camera": True,
        "delete_camera": False,
        "view_locations": True,
        "add_location": False,
        "edit_location": False,
        "delete_location": False,
        
        # User Management - view and edit only
        "view_users": True,
        "create_user": True,
        "edit_user": True,
        "assign_role": False,
        "archive_user": False,
        
        # Permissions - hidden
        "view_permissions": False,
        "configure_permissions": False,
        "view_audit_log": False,
        
        # Categories - hidden
        "view_categories": False,
        "configure_categories": False,
        
        # Audit Log - hidden
        "view_logs": False,
        "filter_logs": False,
    },
    
    "guard": {
        # My Account - all
        "view_profile": True,
        "edit_profile": True,
        "change_password": True,
        
        # Notifications - all
        "view_settings": True,
        "configure_email": True,
        "configure_alerts": True,
        
        # Device & Location - view and manage only
        "view_cameras": True,
        "add_camera": True,
        "edit_camera": True,
        "delete_camera": False,
        "view_locations": True,
        "add_location": False,
        "edit_location": False,
        "delete_location": False,
        
        # User Management - hidden
        "view_users": False,
        "create_user": False,
        "edit_user": False,
        "assign_role": False,
        "archive_user": False,
        
        # Permissions - hidden
        "view_permissions": False,
        "configure_permissions": False,
        "view_audit_log": False,
        
        # Categories - hidden
        "view_categories": False,
        "configure_categories": False,
        
        # Audit Log - hidden
        "view_logs": False,
        "filter_logs": False,
    },
    
    "caregiver": {
        # My Account - all
        "view_profile": True,
        "edit_profile": True,
        "change_password": True,
        
        # Notifications - all
        "view_settings": True,
        "configure_email": True,
        "configure_alerts": True,
        
        # Device & Location - view only
        "view_cameras": True,
        "add_camera": False,
        "edit_camera": False,
        "delete_camera": False,
        "view_locations": True,
        "add_location": False,
        "edit_location": False,
        "delete_location": False,
        
        # User Management - hidden
        "view_users": False,
        "create_user": False,
        "edit_user": False,
        "assign_role": False,
        "archive_user": False,
        
        # Permissions - hidden
        "view_permissions": False,
        "configure_permissions": False,
        "view_audit_log": False,
        
        # Categories - hidden
        "view_categories": False,
        "configure_categories": False,
        
        # Audit Log - hidden
        "view_logs": False,
        "filter_logs": False,
    },
}


def get_features_for_category(category_key: str) -> list:
    """Get all features for a specific category."""
    return CATEGORY_FEATURES.get(category_key, [])


def get_feature_visibility(role_name: str, feature_key: str) -> bool:
    """Get default visibility for a feature in a role."""
    role_features = DEFAULT_FEATURE_VISIBILITY.get(role_name, {})
    return role_features.get(feature_key, False)


def get_all_features_for_role(role_name: str) -> dict:
    """Get all feature visibility settings for a role."""
    return DEFAULT_FEATURE_VISIBILITY.get(role_name, {})
