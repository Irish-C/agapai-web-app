import { normalizeRole } from './roleUtils.js';

// Canonical list of permission labels shown in the Role Overview table.
export const ALL_PERMISSIONS = [
  'Create Users',
  'Edit Users',
  'Archive/Restore Users',
  'Manage Cameras',
  'View Reports',
  'System Settings',
  'View Live Feed',
];

// Source-of-truth role capability matrix for Settings > Role Overview.
// Keep this aligned with backend/frontend authorization:
// - admin-only user management: server/src/routes/user_routes.py (require_admin_user_id)
// - admin-only global settings: server/src/routes/settings_routes.py (require_admin_user_id)
// - authenticated reports/cameras: server/src/routes/event_routes.py, server/src/routes/camera_routes.py
export const ROLE_PERMISSIONS = {
  admin: {
    'Create Users': true,
    'Edit Users': true,
    'Archive/Restore Users': true,
    'Manage Cameras': true,
    'View Reports': true,
    'System Settings': true,
    'View Live Feed': true,
  },
  supervisor: {
    'Create Users': false,
    'Edit Users': false,
    'Archive/Restore Users': false,
    'Manage Cameras': true,
    'View Reports': true,
    'System Settings': false,
    'View Live Feed': true,
  },
  guard: {
    'Create Users': false,
    'Edit Users': false,
    'Archive/Restore Users': false,
    'Manage Cameras': true,
    'View Reports': true,
    'System Settings': false,
    'View Live Feed': true,
  },
  caregiver: {
    'Create Users': false,
    'Edit Users': false,
    'Archive/Restore Users': false,
    'Manage Cameras': true,
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
