"""
Default permissions for each role.
These serve as the baseline permissions that can be overridden in the database.
"""

DEFAULT_PERMISSIONS = {
    'superadmin': {
        'Create Users': True,
        'Edit Users': True,
        'Archive/Restore Users': True,
        'Manage Cameras': True,
        'View Reports': True,
        'System Settings': True,
        'View Live Feed': True,
        'Delete Data': True,
        'Override Permissions': True,
        'Audit Logs': True,
        'Create Roles': True,
    },
    'admin': {
        'Create Users': True,
        'Edit Users': True,
        'Archive/Restore Users': True,
        'Manage Cameras': True,
        'View Reports': True,
        'System Settings': True,
        'View Live Feed': True,
        'Delete Data': False,
        'Override Permissions': False,
        'Audit Logs': False,
        'Create Roles': False,
    },
    'supervisor': {
        'Create Users': True,
        'Edit Users': True,
        'Archive/Restore Users': True,
        'Manage Cameras': True,
        'View Reports': True,
        'System Settings': False,
        'View Live Feed': True,
        'Delete Data': False,
        'Override Permissions': False,
        'Audit Logs': False,
        'Create Roles': False,
    },
    'guard': {
        'Create Users': False,
        'Edit Users': False,
        'Archive/Restore Users': False,
        'Manage Cameras': True,
        'View Reports': True,
        'System Settings': False,
        'View Live Feed': True,
        'Delete Data': False,
        'Override Permissions': False,
        'Audit Logs': False,
        'Create Roles': False,
    },
    'caregiver': {
        'Create Users': False,
        'Edit Users': False,
        'Archive/Restore Users': False,
        'Manage Cameras': False,
        'View Reports': False,
        'System Settings': False,
        'View Live Feed': True,
        'Delete Data': False,
        'Override Permissions': False,
        'Audit Logs': False,
        'Create Roles': False,
    },
}

# All available permissions in the system
ALL_PERMISSIONS = list(DEFAULT_PERMISSIONS['superadmin'].keys())
