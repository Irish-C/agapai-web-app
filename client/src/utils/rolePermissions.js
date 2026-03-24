import { normalizeRole } from './roleUtils.js';

// Canonical list of permission labels shown in the Role Overview table.
export const ALL_PERMISSIONS = [
  'Create Users',
  'Edit Users',
  'Archive/Restore Users',
  'View Users',
  'View Devices/Locations',
  'Manage Devices/Locations',
  'View Reports',
  'System Settings',
  'View Live Feed',
];

// Source-of-truth role capability matrix for Settings > Role Overview.
// Keep this aligned with backend/frontend authorization:
// - user read access: server/src/routes/user_routes.py (require_admin_or_supervisor_user_id)
// - user writes (create/edit/archive): server/src/routes/user_routes.py (require_admin_user_id)
// - camera/location reads: server/src/routes/camera_routes.py, server/src/routes/location_routes.py (get_current_user_id)
// - camera/location writes: server/src/routes/camera_routes.py, server/src/routes/location_routes.py (require_admin_user_id)
// - admin-only global settings: server/src/routes/settings_routes.py (require_admin_user_id)
// - authenticated reports/live feed: server/src/routes/event_routes.py, server/src/routes/camera_routes.py
export const ROLE_PERMISSIONS = {
  admin: {
    'Create Users': true,
    'Edit Users': true,
    'Archive/Restore Users': true,
    'View Users': true,
    'View Devices/Locations': true,
    'Manage Devices/Locations': true,
    'View Reports': true,
    'System Settings': true,
    'View Live Feed': true,
  },
  supervisor: {
    'Create Users': false,
    'Edit Users': false,
    'Archive/Restore Users': false,
    'View Users': true,
    'View Devices/Locations': true,
    'Manage Devices/Locations': false,
    'View Reports': true,
    'System Settings': false,
    'View Live Feed': true,
  },
  guard: {
    'Create Users': false,
    'Edit Users': false,
    'Archive/Restore Users': false,
    'View Users': false,
    'View Devices/Locations': true,
    'Manage Devices/Locations': false,
    'View Reports': true,
    'System Settings': false,
    'View Live Feed': true,
  },
  caregiver: {
    'Create Users': false,
    'Edit Users': false,
    'Archive/Restore Users': false,
    'View Users': false,
    'View Devices/Locations': false,
    'Manage Devices/Locations': false,
    'View Reports': true,
    'System Settings': false,
    'View Live Feed': true,
  },
};

export function hasPermission(role, permission) {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) return false;
  return Boolean(ROLE_PERMISSIONS[normalizedRole]?.[permission]);
}
