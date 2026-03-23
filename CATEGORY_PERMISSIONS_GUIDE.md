# Category-Based Settings Permissions System

## Overview

The Category-Based Settings Permissions System allows superadmins to have fine-grained control over which settings tabs (categories) are visible to each role, and what functions each role can perform within those categories.

## Architecture

### Database Models

#### 1. `SettingsCategory`
Defines the available settings tabs/sections in the application.

**Fields:**
- `id` (BigInt): Primary key
- `category_key` (String): Unique identifier (e.g., "my_account", "user_management")
- `category_name` (String): Display name (e.g., "My Account", "User Management")
- `description` (String, optional): Description of the category
- `icon_class` (String, optional): CSS class for icon (e.g., "FaUserCog")
- `sort_order` (Int): Display order in navigation (default: 0)
- `is_active` (Boolean): Whether the category is active
- `created_at` (DateTime): Creation timestamp
- `updated_at` (DateTime): Last update timestamp

**Default Categories:**
```
- my_account (My Account) - User own account settings
- notifications (Notifications) - Email and alert settings
- device_location (Device and Location) - Camera and location management
- user_management (User Management) - Create/edit users
- permissions (Role Permissions) - Configure role permissions
- category_permissions (Settings Categories) - Configure category visibility
- audit_log (Audit Log) - View system activity logs
```

#### 2. `CategoryPermission`
Maps permission for a specific role to a specific category.

**Fields:**
- `id` (BigInt): Primary key
- `category_id` (BigInt): Foreign key to SettingsCategory
- `role_id` (BigInt): Foreign key to Role
- `is_visible` (Boolean): Whether this category is visible to this role
- `allowed_functions` (String[]): List of allowed functions (read, write, delete)
- `created_at` (DateTime): Creation timestamp
- `updated_at` (DateTime): Last update timestamp
- `created_by` (BigInt): User who created/modified this permission
- **Unique constraint**: (category_id, role_id)

**Functions:**
- `read` - View/read the category
- `write` - Create/modify items in the category
- `delete` - Delete items in the category

### Default Permissions

#### SuperAdmin Role
All categories visible with all functions:
- my_account: visible, [read, write]
- notifications: visible, [read, write]
- device_location: visible, [read, write, delete]
- user_management: visible, [read, write, delete]
- permissions: visible, [read, write]
- category_permissions: visible, [read, write]
- audit_log: visible, [read]

#### Admin Role
All admin-level categories visible, but NOT permission management:
- my_account: visible, [read, write]
- notifications: visible, [read, write]
- device_location: visible, [read, write, delete]
- user_management: visible, [read, write]
- permissions: HIDDEN, []
- category_permissions: HIDDEN, []
- audit_log: HIDDEN, []

#### User Role
Only personal settings visible:
- my_account: visible, [read, write]
- notifications: visible, [read, write]
- device_location: HIDDEN, []
- user_management: HIDDEN, []
- permissions: HIDDEN, []
- category_permissions: HIDDEN, []
- audit_log: HIDDEN, []

## API Endpoints

### Get All Categories
```
GET /api/admin/permissions/categories
Authorization: Bearer {token}
Response: List[CategoryInfo]
```

### Get Category Permissions for Role
```
GET /api/admin/permissions/categories/{role_id}
Authorization: Bearer {token}
Response: RoleCategoryPermissionsResponse
```

Example response:
```json
{
  "role_id": 1,
  "role_name": "admin",
  "categories": {
    "my_account": {
      "category_id": 1,
      "category_name": "My Account",
      "is_visible": true,
      "allowed_functions": ["read", "write"]
    },
    "user_management": {
      "category_id": 4,
      "category_name": "User Management",
      "is_visible": true,
      "allowed_functions": ["read", "write"]
    }
  }
}
```

### Get Visible Categories for Role (Public)
```
GET /api/admin/permissions/categories/{role_id}/visible
Response: List[VisibleCategoryResponse]
```

Example response:
```json
[
  {
    "category_key": "my_account",
    "category_name": "My Account",
    "icon_class": "FaUserCog",
    "functions": ["read", "write"]
  },
  {
    "category_key": "notifications",
    "category_name": "Notifications",
    "icon_class": "FaBell",
    "functions": ["read", "write"]
  }
]
```

### Update Category Permission for Role
```
PUT /api/admin/permissions/categories/{role_id}/{category_key}
Authorization: Bearer {token}
Content-Type: application/json

{
  "is_visible": true,
  "allowed_functions": ["read", "write", "delete"],
  "reason": "Granting delete access"
}
```

### Bulk Update Categories for Role
```
POST /api/admin/permissions/categories/{role_id}/bulk-update
Authorization: Bearer {token}
Content-Type: application/json

{
  "my_account": {
    "is_visible": true,
    "allowed_functions": ["read", "write"],
    "reason": "Updated"
  },
  "user_management": {
    "is_visible": false,
    "allowed_functions": [],
    "reason": "Restricted access"
  }
}
```

### Reset Category Permissions to Defaults
```
DELETE /api/admin/permissions/categories/{role_id}
Authorization: Bearer {token}
```

## Frontend Components

### CategoryPermissionManager
New component for superadmins to manage category visibility and functions:

**Location:** `client/src/features/manager/CategoryPermissionManager.jsx`

**Features:**
- Select role to configure
- View all categories in a grid
- Toggle visibility for each category
- Select allowed functions (read, write, delete)
- Save bulk changes
- Track unsaved changes
- Reset to defaults

**Usage:**
```jsx
import CategoryPermissionManager from '../features/manager/CategoryPermissionManager.jsx';

// In your admin dashboard or settings
<CategoryPermissionManager />
```

### Updated SettingsPage
The SettingsPage now:
1. Fetches visible categories for the current user's role
2. Dynamically filters navigation items based on category permissions
3. Shows only categories the user has access to
4. Integrates the CategoryPermissionManager for superadmins

## Implementation Steps

### 1. Database Migration
Create a new migration that adds the SettingsCategory and CategoryPermission models:

```bash
cd server
npx prisma migrate dev --name add_settings_categories
```

### 2. Initialize Categories
Add initialization code to the app startup to create default categories:

```python
from src.services.category_permission_service import CategoryPermissionService

# On app startup
@app.on_event("startup")
async def startup_event():
    # Initialize default categories
    await CategoryPermissionService.initialize_default_categories()
    
    # Initialize permissions for existing roles
    roles = await db.role.find_many()
    for role in roles:
        # Check if permissions exist
        existing = await db.categorypermission.find_first(
            where={"role_id": role.id}
        )
        if not existing:
            await CategoryPermissionService.initialize_role_categories(
                role.id, 
                created_by=1  # System user
            )
```

### 3. Create New Role with Categories
When creating a new role, initialize its category permissions:

```python
from src.services.category_permission_service import CategoryPermissionService

# In user_controller or wherever roles are created
new_role = await db.role.create(data={"role_name": "new_role"})

# Initialize default category permissions
await CategoryPermissionService.initialize_role_categories(
    role_id=new_role.id,
    created_by=current_user_id
)
```

## Usage Examples

### For Superadmins

1. **Hide a category from a role:**
   - Go to Settings → Settings Categories (new tab for superadmins)
   - Select the role
   - Click the visibility toggle to hide the category
   - Save changes

2. **Restrict user management to read-only:**
   - Select Admin role
   - Find "User Management" category
   - Uncheck "write" and "delete" functions
   - Save changes
   - Now admins can only view users, not create/edit/delete

3. **Allow custom role to access audit logs:**
   - Create custom role
   - Assign it to CategoryPermissionManager
   - Make "Audit Log" visible, allow "read" function
   - Now that role can view audit logs

### For Frontend Components

```jsx
// Check if user has access to a category
const hasAccess = visibleCategories.some(cat => cat.category_key === 'user_management');

// Check if user can perform a function in a category
const canDelete = visibleCategories
  .find(cat => cat.category_key === 'user_management')
  ?.functions.includes('delete');

if (canDelete) {
  // Show delete button
}
```

## Security Considerations

1. **Backend Enforcement**: Always check category permissions on the backend, not just the frontend
2. **Function-Level Access**: Implement function-level checks in each component
3. **Audit Logging**: All permission changes are logged in the database
4. **Role-Based Access**: Only superadmins can modify category permissions
5. **Cascading Deletes**: If a category is deleted, related permissions are cascaded

## Migration from Old Permission System

If you have an existing permission system:

1. Map old permissions to new categories/functions
2. Run initialization to create categories
3. Manually configure CategoryPermission records for existing roles
4. Test thoroughly before production deployment

## Troubleshooting

### Categories not showing up
- Verify the database migration ran successfully
- Check that `SettingsCategory` table has records
- Ensure the initialization code ran on app startup

### Navigation not updating
- Clear browser cache
- Check that the API endpoint returns correct data
- Verify user has the expected role_id

### Permission changes not taking effect
- Restart the frontend app
- Clear local storage
- Check browser console for API errors

## Future Enhancements

1. **Granular Function Permissions**: Define custom functions beyond read/write/delete
2. **Time-Based Permissions**: Allow access to categories only during certain times
3. **Delegation**: Allow admins to temporarily grant permissions
4. **Permission Templates**: Save and apply permission configurations as templates
5. **Audit Dashboard**: More detailed audit logging and visualization
