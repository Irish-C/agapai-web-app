# Category Permissions System - Setup Guide

## Overview

The category permissions feature is now **integrated into the existing Role Permissions Manager** (not a separate component). Superadmins can now configure both:
1. **Role Permissions** - Grant/deny specific system actions
2. **Settings Categories** - Control which settings tabs are visible and what functions each role can access

## Quick Start (5 minutes)

### Step 1: Run Database Migration

```bash
cd /home/maryc/agapai-web-app/server

# Create and run the migration
npx prisma migrate dev --name add_settings_categories
```

This creates the `SettingsCategory` and `CategoryPermission` tables.

### Step 2: Initialize Categories

```bash
python initialize_categories.py
```

This script:
- Creates default settings categories (My Account, User Management, Device & Location, etc.)
- Initializes category permissions for each role with sensible defaults
- Shows a summary of what was created

### Step 3: Access Category Permissions

1. Log in as a superadmin
2. Go to Settings → Role Permissions
3. Select a role
4. Click the **"Settings Categories"** tab
5. Manage visibility and functions for each category

That's it! The system is now ready to use.

## What Changed

### Database
- **New table:** `SettingsCategory` - Defines available settings tabs
- **New table:** `CategoryPermission` - Maps role → category with visibility & functions
- **Modified:** `Role` model - Added relationship to categories
- **Modified:** `User` model - Added relationship to category permissions

### Backend
- **New file:** `src/services/category_permission_service.py` - Service for managing category permissions
- **New routes:** `/api/admin/permissions/categories/*` - API endpoints for category management
- **Updated:** `permission_routes.py` - Added category permission endpoints

### Frontend
- **Updated:** `PermissionManager.jsx` - Added "Settings Categories" tab
- **Removed:** Separate `CategoryPermissionManager.jsx` component
- **Updated:** `SettingsPage.jsx` - Reverted to original, now only uses PermissionManager

## API Endpoints

### Get All Categories
```
GET /api/admin/permissions/categories
Response: List of all settings categories
```

### Get Category Permissions for Role
```
GET /api/admin/permissions/categories/{role_id}
Response: All category permissions for the role
```

### Get Visible Categories (for Frontend Navigation)
```
GET /api/admin/permissions/categories/{role_id}/visible
Response: Only visible categories for the role
```

### Update Category Permission
```
PUT /api/admin/permissions/categories/{role_id}/{category_key}
Body: {
  "is_visible": true,
  "allowed_functions": ["read", "write", "delete"],
  "reason": "Granting permissions"
}
```

### Bulk Update Categories
```
POST /api/admin/permissions/categories/{role_id}/bulk-update
Body: {
  "my_account": { "is_visible": true, "allowed_functions": ["read", "write"] },
  "user_management": { "is_visible": false, "allowed_functions": [] }
}
```

### Reset to Defaults
```
DELETE /api/admin/permissions/categories/{role_id}
```

## Default Roles & Categories

### SuperAdmin
- ✅ My Account (read, write)
- ✅ Notifications (read, write)
- ✅ Device & Location (read, write, delete)
- ✅ User Management (read, write, delete)
- ✅ Role Permissions (read, write)
- ✅ Audit Log (read)

### Admin
- ✅ My Account (read, write)
- ✅ Notifications (read, write)
- ✅ Device & Location (read, write, delete)
- ✅ User Management (read, write)
- ❌ Role Permissions (hidden)
- ❌ Audit Log (hidden)

### User
- ✅ My Account (read, write)
- ✅ Notifications (read, write)
- ❌ Device & Location (hidden)
- ❌ User Management (hidden)
- ❌ Role Permissions (hidden)
- ❌ Audit Log (hidden)

## How to Use

### For Superadmins

**Scenario 1: Hide a feature from admins**
1. Settings → Role Permissions
2. Select "admin" role
3. Click "Settings Categories" tab
4. Find "Device and Location"
5. Toggle "Visible" to OFF
6. Click "Save Category Changes"

**Scenario 2: Restrict user management to read-only**
1. Settings → Role Permissions
2. Select "admin" role
3. Click "Settings Categories" tab
4. Find "User Management"
5. Uncheck "write" and "delete" functions
6. Leave only "read" checked
7. Click "Save Category Changes"

**Scenario 3: Create a limited manager role**
1. Create new role (e.g., "manager")
2. Go to Role Permissions, select the new role
3. Click "Settings Categories" tab
4. Make visible: My Account, Notifications, Device & Location (read, write only, no delete)
5. Set others to hidden
6. Click "Save Category Changes"

### For Developers

**Check if user can access a category:**
```javascript
const visibleCategories = await categoryPermissionService.get_visible_categories(role_id);
const hasAccess = visibleCategories.some(cat => cat.category_key === 'user_management');
```

**Check if user can perform a function:**
```javascript
const category = visibleCategories.find(cat => cat.category_key === 'user_management');
const canDelete = category && category.functions.includes('delete');
```

**In React components:**
```jsx
// Fetch visible categories for current user
const [visibleCategories, setVisibleCategories] = useState([]);

useEffect(() => {
  const fetchCategories = async () => {
    const res = await axios.get(
      `http://127.0.0.1:5000/api/admin/permissions/categories/${roleId}/visible`
    );
    setVisibleCategories(res.data);
  };
  fetchCategories();
}, [roleId]);

// Use in render
const canDelete = visibleCategories
  .find(cat => cat.category_key === 'users')
  ?.functions.includes('delete');

if (canDelete) {
  // Show delete button
}
```

## Troubleshooting

### "Settings Categories not yet initialized" Message

**Problem:** The PermissionManager is showing the initialization message.

**Solution:**
```bash
cd /home/maryc/agapai-web-app/server
python initialize_categories.py
```

### 500 Error When Fetching Categories

**Problem:** Get request to `/api/admin/permissions/categories/{role_id}` returns 500.

**Causes:**
1. Database migration hasn't been run
2. Categories haven't been initialized
3. Role doesn't have category permissions yet

**Solution:**
```bash
# 1. Run migration
cd server && npx prisma migrate dev --name add_settings_categories

# 2. Initialize
python initialize_categories.py

# 3. Restart the backend server
```

### Changes Not Saving

**Problem:** Click "Save Category Changes" but nothing happens.

**Check:**
1. Are there unsaved changes? (The count badge should show a number)
2. Are you logged in as superadmin?
3. Check browser console for errors
4. Check backend server logs

### Can't See Both Tabs in Role Permissions

**Problem:** Only see "Role Permissions" tab, no "Settings Categories" tab.

**Cause:** Categories table is empty or hasn't been initialized.

**Solution:**
```bash
python server/initialize_categories.py
```

### Categories Visible But Settings Changes Have No Effect

**Problem:** Changed category permissions but users still see hidden categories.

**Causes:**
1. Frontend hasn't refetched category permissions
2. User needs to log out and log back in
3. The frontend isn't checking category permissions

**Solution:**
1. Clear browser cache
2. Log out and log back in
3. Verify the API is returning correct visibility status:
   ```bash
   curl -H "Authorization: Bearer {token}" \
     http://127.0.0.1:5000/api/admin/permissions/categories/{role_id}/visible
   ```

## Migration Path for Existing Systems

If upgrading an existing system:

1. **Backup database** (always do this first!)
   ```bash
   pg_dump agapai_db > backup_$(date +%s).sql
   ```

2. **Create migration**
   ```bash
   cd server
   npx prisma migrate dev --name add_settings_categories
   ```

3. **Initialize categories**
   ```bash
   python initialize_categories.py
   ```

4. **Test thoroughly**
   - Log in as each role
   - Verify correct categories are visible
   - Test permission changes take effect

5. **No breaking changes:**
   - Existing role permissions still work
   - Settings functionality is backward compatible
   - Can be deployed without downtime (with care)

## File Locations

- **Database Schema:** `server/prisma/schema.prisma`
- **Service:** `server/src/services/category_permission_service.py`
- **Routes:** `server/src/routes/permission_routes.py`
- **UI Component:** `client/src/components/features/PermissionManager.jsx`
- **Initialization Script:** `server/initialize_categories.py`
- **Documentation:** `CATEGORY_PERMISSIONS_GUIDE.md`

## Next Steps

1. ✅ Run initialization script
2. ✅ Visit Role Permissions manager
3. ✅ Configure categories for each role
4. ✅ Test with different user roles
5. Test more advanced scenarios:
   - Create custom roles with specific permissions
   - Test permission enforcement in backend
   - Audit log changes to categories

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `CATEGORY_PERMISSIONS_GUIDE.md` for technical details
3. Check backend server logs for errors
4. Check browser developer console for frontend errors
