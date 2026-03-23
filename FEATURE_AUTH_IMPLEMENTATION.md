# Feature-Level Authorization Implementation Guide

## Overview

The new feature-based authorization system provides granular, role-based access control through specific feature keys instead of generic "read/write/delete" permissions.

## Files Created

### 1. `src/utils/feature_auth.py` (New)
Authorization dependency functions for FastAPI route protection using feature-level checks.

### 2. `src/services/feature_service.py` 
Core service for feature caching and permission validation (already created).

### 3. `src/routes/feature_routes_sql.py`
Admin API endpoints for managing feature visibility per role.

---

## Usage Examples

### Example 1: Protect a Single Endpoint with One Feature

**Old Way (Permission-based):**
```python
from src.utils.permission_auth import require_permission

@app.post("/cameras")
async def create_camera(
    camera_data: CameraCreate,
    _: None = Depends(require_permission("Manage Cameras"))
):
    # Create camera logic
    pass
```

**New Way (Feature-based):**
```python
from src.utils.feature_auth import require_feature

@app.post("/cameras")
async def create_camera(
    camera_data: CameraCreate,
    _: None = Depends(require_feature("add_camera"))
):
    # Create camera logic
    pass
```

### Example 2: Allow Multiple Actions (OR Logic)

Use when a user needs ANY ONE of several features to access an endpoint.

```python
from src.utils.feature_auth import require_any_feature

@app.get("/cameras/edit")
async def view_camera_edit_page(
    _: None = Depends(require_any_feature("edit_camera", "add_camera"))
):
    # Show edit page if user can either edit or add cameras
    pass
```

### Example 3: Require All Features (AND Logic)

Use when a user must have EVERY feature to access an endpoint.

```python
from src.utils.feature_auth import require_all_features

@app.delete("/cameras/{camera_id}")
async def delete_camera(
    camera_id: int,
    _: None = Depends(require_all_features("delete_camera", "view_cameras"))
):
    # Only users with BOTH delete_camera AND view_cameras can access
    pass
```

### Example 4: Get Current User's Features (For UI)

Use in route handlers to show/hide UI elements or conditionally execute logic.

```python
from src.utils.feature_auth import get_user_features

@app.get("/api/user/features")
async def get_user_available_features(
    features: Set[str] = Depends(get_user_features)
) -> Dict[str, bool]:
    return {feature: True for feature in features}
```

Then in frontend:
```javascript
const response = await fetch('/api/user/features');
const userFeatures = await response.json();

// Show/hide UI based on available features
if (userFeatures.has('add_camera')) {
    // Show "Add Camera" button
}
```

### Example 5: Multiple Dependencies in One Route

Combine multiple feature checks and other dependencies.

```python
from src.utils.feature_auth import require_feature, get_user_features

@app.put("/cameras/{camera_id}")
async def update_camera(
    camera_id: int,
    update_data: CameraUpdate,
    user_id: str = Depends(get_current_user_id),
    _: None = Depends(require_feature("edit_camera")),
    user_features: Set[str] = Depends(get_user_features),
):
    # Access user_id for audit logging, ensure edit_camera is available,
    # and have access to all user features for conditional logic
    pass
```

---

## Migration Path: Updating Routes

### Step 1: Identify Routes Using Old Permissions
```bash
grep -r "require_permission\|require_any_permission\|require_all_permissions" server/src/routes/
```

### Step 2: Map Old Permissions to New Features

| Old Permission | New Feature(s) |
|---|---|
| Manage Cameras | add_camera, edit_camera, delete_camera |
| View Cameras | view_cameras |
| Manage Locations | add_location, edit_location, delete_location |
| View Locations | view_locations |
| Manage Users | create_user, edit_user, archive_user |
| View Users | view_users |
| Assign Roles | assign_role |
| Edit Settings | configure_* (multiple) |
| View Reports | view_logs, filter_logs |

### Step 3: Update Imports

```python
# OLD
from src.utils.permission_auth import require_permission, require_any_permission

# NEW
from src.utils.feature_auth import require_feature, require_any_feature
```

### Step 4: Update Decorator Usage

```python
# OLD
_: None = Depends(require_permission("Manage Cameras"))

# NEW
_: None = Depends(require_feature("add_camera"))
```

---

## Available Features by Category

### my_account (3 features)
- `view_profile` - View own account profile
- `edit_profile` - Edit own profile information
- `change_password` - Change own password

### notifications (3 features)
- `view_settings` - View notification preferences
- `configure_email` - Enable/disable email notifications
- `configure_alerts` - Set alert thresholds

### device_location (8 features)
- `view_cameras` - View camera list and details
- `add_camera` - Add new cameras
- `edit_camera` - Edit camera settings
- `delete_camera` - Delete cameras
- `view_locations` - View location list
- `add_location` - Add new locations
- `edit_location` - Edit location settings
- `delete_location` - Delete locations

### user_management (5 features)
- `view_users` - View user list and details
- `create_user` - Create new users
- `edit_user` - Edit user information
- `assign_role` - Change user roles
- `archive_user` - Archive/restore users

### permissions (3 features)
- `view_permissions` - View feature permission matrix
- `configure_permissions` - Modify feature visibility per role
- `view_audit_log` - View permission change audit logs

### category_permissions (2 features)
- `view_categories` - View settings categories
- `configure_categories` - Manage category visibility

### audit_log (2 features)
- `view_logs` - View system audit logs
- `filter_logs` - Filter and search logs

---

## Role-Feature Matrix

### SuperAdmin
- **Access**: All 34 features (100%)
- **Use for**: Complete system access, no restrictions

### Admin
- **Access**: 30 features (excludes deletions and audit log access)
- **Denied**: delete_camera, delete_location, view_audit_log
- **Use for**: Full management except destructive operations

### Supervisor
- **Access**: 22 features (limited user management)
- **Denied**: user management deletions, archive_user, permission editing
- **Use for**: Managing cameras/locations and some users

### Guard
- **Access**: 17 features (view and limited additions only)
- **Denied**: Delete operations, user management (except view)
- **Use for**: Security personnel needing to add cameras/locations

### Caregiver
- **Access**: 10 features (view-only and own profile only)
- **Allowed**: View cameras, view locations, view users, view logs, edit own profile
- **Denied**: All creation and deletion
- **Use for**: Minimal operational access

---

## Frontend Integration

### API Endpoint for User Features
Frontend can fetch the current user's available features:

```javascript
// Get current user's feature visibility
const response = await fetch('/api/admin/features/me', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const userFeatures = await response.json();
// Returns: { add_camera: true, delete_camera: false, ... }
```

### Conditional Rendering Example
```jsx
import { useEffect, useState } from 'react';

function CameraManagement() {
    const [features, setFeatures] = useState({});
    
    useEffect(() => {
        const fetchFeatures = async () => {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/features/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setFeatures(await response.json());
        };
        fetchFeatures();
    }, []);
    
    return (
        <div>
            <h2>Cameras</h2>
            
            {features.add_camera && (
                <button onClick={addCamera}>Add Camera</button>
            )}
            
            {features.edit_camera && (
                <button onClick={editCamera}>Edit Selected</button>
            )}
            
            {features.delete_camera && (
                <button onClick={deleteCamera} className="danger">
                    Delete Selected
                </button>
            )}
        </div>
    );
}
```

---

## Testing Feature Auth

### Test Endpoint Protection
```bash
# Get valid token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}' | jq -r '.access_token')

# Test protected endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/cameras

# Test GET current user features
curl http://localhost:5000/api/admin/features/me \
  -H "Authorization: Bearer $TOKEN"
```

### Test As Different Roles
Use test users with different roles to verify features are correctly visible:
- superadmin (all features)
- admin (no deletions)
- supervisor (limited)
- guard (view-only)
- caregiver (minimal)

---

## Error Handling

When a user doesn't have a required feature, they'll receive:

```json
{
    "detail": "Feature 'delete_camera' is not available to your role"
}
```

Or for multiple features:

```json
{
    "detail": "Feature access denied. Required: any of [edit_camera, add_camera]"
}
```

---

## Next Steps

1. **Update Routes**: Replace `require_permission` with `require_feature` in all route files
2. **Frontend Integration**: Update components to use `/api/admin/features/me` endpoint
3. **Testing**: Test each role with new feature-based access control
4. **Monitoring**: Watch audit logs for permission changes via `/api/admin/features/audit-log`
5. **Cleanup**: Remove old permission-based functions after full migration

---

## Key Differences from Permission System

| Aspect | Old Permissions | New Features |
|---|---|---|
| Granularity | 11 global permissions | 34 category-specific features |
| Source of Truth | Single permission table | Feature definitions in code + overrides in DB |
| Inheritance | Role hierarchy | Flat role structure with explicit per-feature visibility |
| UI Impact | Generic read/write/delete buttons | Specific action buttons (add_camera, archive_user, etc.) |
| Auditability | Permission changes tracked | Feature visibility changes tracked with reasons |

