# Authentication & Authorization System Exploration

## Overview
This document maps the complete auth system architecture: backend decorators, permission checking, frontend guards, and data flow from login to protected actions.

---

## 1. Backend Authorization Decorators/Checks

### Location
- **Primary:** [server/src/utils/permission_auth.py](server/src/utils/permission_auth.py)
- **Supporting:** [server/src/utils/auth.py](server/src/utils/auth.py)

### Implementation Pattern
The system uses **FastAPI Dependency Injection** (not traditional `@` decorators), providing granular permission checking:

#### Single Permission Check
```python
# Usage in routes:
@app.get("/protected")
async def protected_route(
    user = Depends(get_current_user),
    _: None = Depends(require_permission("Manage Cameras"))
):
    return {"message": "Access granted"}
```

Returns `HTTPException(403)` if user's role lacks the permission.

#### Multiple Permission Checks
```python
# Any permission (OR logic)
_: None = Depends(require_any_permission("Manage Cameras", "View Reports"))

# All permissions (AND logic)  
_: None = Depends(require_all_permissions("Manage Cameras", "Delete Data"))
```

#### Get User Permissions (For UI)
```python
async def get_user_permissions(
    user = Depends(get_current_user),
) -> Set[str]:
    # Returns all granted permissions for user's role
    # Used to show available actions in frontend
```

### Traditional Role-Based Checks (Backup)
```python
# Fallback for simple role checks
async def require_admin_user_id(user_id: str = Depends(get_current_user_id)) -> str:
    # Validates role in {'admin', 'superadmin'}
    
async def require_superadmin_user_id(user_id: str = Depends(get_current_user_id)) -> str:
    # Validates role == 'superadmin' only
```

---

## 2. Backend Permission Checking Logic

### Permission Service Architecture
**File:** [server/src/services/permission_service.py](server/src/services/permission_service.py)

#### Permission Cache Class
Manages in-memory caching with automatic invalidation:

```python
class PermissionCache:
    def __init__(self, cache_ttl_minutes: int = 2):
        self._cache: Dict[int, Dict[str, bool]] = {}
        self._cache_timestamps: Dict[int, datetime] = {}
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
    
    async def get_permissions(self, role_id: int) -> Dict[str, bool]:
        # Check cache validity (2-minute TTL)
        if self._is_cache_valid(role_id):
            return self._cache[role_id].copy()
        
        # Fetch fresh from DB if stale
        permissions = await self._fetch_permissions_from_db(role_id)
        self._cache[role_id] = permissions.copy()
        return permissions
```

#### Permission Merging Strategy
```python
# 1. Start with CODE defaults (from permission_constants.py)
merged_permissions = DEFAULT_PERMISSIONS.get(role.role_name, {}).copy()

# 2. If role has parent, inherit from parent first
if role.parent_role:
    parent_permissions = DEFAULT_PERMISSIONS.get(
        role.parent_role.role_name, {}
    ).copy()
    # Apply parent's DB overrides
    if role.parent_role.permission_overrides:
        for perm in role.parent_role.permission_overrides:
            parent_permissions[perm.permission_name] = perm.is_granted
    merged_permissions = parent_permissions.copy()

# 3. Apply THIS role's DB overrides (final override)
if role.permission_overrides:
    for perm in role.permission_overrides:
        merged_permissions[perm.permission_name] = perm.is_granted

return merged_permissions
```

#### Permission Checker Class
```python
class PermissionChecker:
    async def has_permission(self, role_id: int, permission: str) -> bool:
        permissions = await self.cache.get_permissions(role_id)
        return permissions.get(permission, False)
    
    async def has_any_permission(self, role_id: int, 
                                 permissions: Set[str]) -> bool:
        role_perms = await self.cache.get_permissions(role_id)
        return any(role_perms.get(p, False) for p in permissions)
    
    async def has_all_permissions(self, role_id: int,
                                  permissions: Set[str]) -> bool:
        role_perms = await self.cache.get_permissions(role_id)
        return all(role_perms.get(p, False) for p in permissions)
    
    async def get_granted_permissions(self, role_id: int) -> Set[str]:
        # Returns all True permissions
    
    async def get_denied_permissions(self, role_id: int) -> Set[str]:
        # Returns all False permissions
```

### Default Permissions (Code-Level)
**File:** [server/src/utils/permission_constants.py](server/src/utils/permission_constants.py)

Hardcoded baseline for each role (overridable in database):

```python
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
        'Delete Data': False,           # ← Admin cannot delete
        'Override Permissions': False,   # ← Cannot modify permissions
        'Audit Logs': False,
        'Create Roles': False,
    },
    'supervisor': {
        'Create Users': True,
        'Edit Users': True,
        'Archive/Restore Users': True,
        'Manage Cameras': True,
        'View Reports': True,
        'System Settings': False,       # ← Supervisor cannot access settings
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
        'Manage Cameras': True,         # ← Guards focus on cameras
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
        'Manage Cameras': False,        # ← Caregivers have minimal access
        'View Reports': False,
        'System Settings': False,
        'View Live Feed': True,         # ← Can view live feed only
        'Delete Data': False,
        'Override Permissions': False,
        'Audit Logs': False,
        'Create Roles': False,
    },
}

ALL_PERMISSIONS = list(DEFAULT_PERMISSIONS['superadmin'].keys())
```

---

## 3. Frontend Permission Checks

### Role Utilities Library
**File:** [client/src/utils/roleUtils.js](client/src/utils/roleUtils.js)

```javascript
// Normalize role to lowercase
export function normalizeRole(role) {
  return typeof role === 'string' ? role.toLowerCase() : null;
}

// Convert normalized role to title case for display
export function displayRole(role) {
  const normalized = normalizeRole(role);
  if (!normalized) return normalized;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  // 'admin' -> 'Admin', 'guard' -> 'Guard'
}

// Get Tailwind CSS styling for role badges
export function getRoleColors(role) {
  const normalized = normalizeRole(role);
  
  const colorMap = {
    'superadmin': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'admin': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    'supervisor': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'guard': { bg: 'bg-green-100', text: 'text-green-800' },
    'caregiver': { bg: 'bg-purple-100', text: 'text-purple-800' },
  };
  
  return colorMap[normalized] || { bg: 'bg-gray-100', text: 'text-gray-800' };
}
```

### Authentication Context Provider
**File:** [client/src/components/AuthContext.jsx](client/src/components/AuthContext.jsx)

Primary frontend auth state management:

```javascript
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // ✓ Persists to localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setIsAuthReady(true);
  }, []);

  const login = async (username, password) => {
    const response = await loginUser(username, password);
    if (response && (response.access_token || response.token)) {
      const token = response.access_token || response.token;
      const userData = {
        username: response.username,
        token: token,
        userId: response.user_id,
        role: response.role  // ✓ Role stored here
      };
      setUser(userData);
      setToken(token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', token);
      return { success: true, message: 'Login successful' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};
```

User object structure stored in context:
```javascript
{
  username: "john_doe",
  token: "eyJhbGc...",  // JWT token
  userId: "123",         // User ID as string
  role: "admin"          // Normalized role name
}
```

### Protected Route Component
**File:** [client/src/components/ProtectedRoute.jsx](client/src/components/ProtectedRoute.jsx)

Conditional rendering based on authentication state.

### User Manager Hook
**File:** [client/src/hooks/useUserManager.js](client/src/hooks/useUserManager.js)

```javascript
export const useUserManager = (user) => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    
    // Load users from API
    const loadUsers = async () => {
        if (!user || !user.userId) return;
        try {
            const userData = await fetchUsers({ archivedOnly: showArchived });
            setUsers(Array.isArray(userData) ? userData : []);
        } catch (err) {
            console.error("Error loading users:", err);
        }
    };
    
    // Load available roles from API
    const loadRoles = async () => {
        try {
            const result = await fetchRolesApi();
            if (result && Array.isArray(result.data)) {
                setRoles(result.data.map(r => normalizeRole(r)));
            }
        } catch (err) {
            setRoles([]);
        }
    };
    
    useEffect(() => {
        loadUsers();
    }, [user, showArchived]);
    
    useEffect(() => {
        loadRoles();
    }, []);
};
```

### Permission Display Component
**File:** [client/src/features/manager/UserManager.jsx](client/src/features/manager/UserManager.jsx)

Fetches and displays role permission matrix:

```javascript
// FETCH ROLE PERMISSIONS ON MOUNT
useEffect(() => {
    const fetchRolePermissions = async () => {
        try {
            const response = await axios.get(
                'http://127.0.0.1:5000/api/admin/permissions/roles',
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
                }
            );
            
            // Build permission matrix: { roleName: { permissionName: boolean } }
            const permMatrix = {};
            const allPerms = new Set();
            
            response.data.forEach(role => {
                const roleName = role.role_name.toLowerCase();
                permMatrix[roleName] = role.permissions;
                Object.keys(role.permissions).forEach(perm => allPerms.add(perm));
            });
            
            setRolePermissions(permMatrix);
            setAllPermissions(Array.from(allPerms).sort());
        } catch (err) {
            console.error('Failed to fetch role permissions:', err);
        }
    };
    
    fetchRolePermissions();
}, []);

// REAL-TIME UPDATES VIA WEBSOCKET
useEffect(() => {
    const handlePermissionsUpdated = (data) => {
        console.log('Permissions updated, refreshing role overview');
        // Re-fetch role permissions when superadmin changes them
        fetchRolePermissions();
    };
    
    socket.on('permissions_updated', handlePermissionsUpdated);
    socket.on('permissions_changed', handlePermissionsUpdated);
    
    return () => {
        socket.off('permissions_updated', handlePermissionsUpdated);
        socket.off('permissions_changed', handlePermissionsUpdated);
    };
}, []);
```

Renders Role Permissions Overview table:
```javascript
<table>
    <thead>
        <tr>
            <th>Role</th>
            {allPermissions.map(perm => (
                <th key={perm}>{perm}</th>
            ))}
        </tr>
    </thead>
    <tbody>
        {roles.map(role => (
            <tr key={role}>
                <td>{displayRole(role)}</td>
                {allPermissions.map(perm => (
                    <td key={`${role}-${perm}`}>
                        {rolePermissions[role]?.[perm] ? (
                            <span className="text-green-600 font-bold">✓</span>
                        ) : (
                            <span className="text-red-500 font-bold">✕</span>
                        )}
                    </td>
                ))}
            </tr>
        ))}
    </tbody>
</table>
```

---

## 4. Data Flow: Login to Protected Actions

### Step 1: User Submits Credentials
```
Frontend (LoginPage) 
  → Calls loginUser(username, password)
```

### Step 2: Backend Authentication
**Route:** [server/src/routes/user_routes.py](server/src/routes/user_routes.py) - `POST /login`  
**Logic:** [server/src/controllers/user_controller.py](server/src/controllers/user_controller.py) - `login_logic()`

```python
async def login_logic(data):
    # Find user and include their role
    user = await db.user.find_unique(
        where={'username': data.get('username')},
        include={'role': True}
    )
    
    if user and password_is_valid:
        return {
            "status": "success", 
            "user_id": str(user.id),           # ← User ID
            "username": user.username,
            "role": normalize_role(user.role.role_name),  # ← Normalized role
            "access_token": create_token(user.id)  # ← JWT token
        }, 200
    
    return {"status": "error", "message": "Invalid credentials"}, 401
```

### Step 3: Frontend Stores User Data
**File:** [client/src/services/apiService.js](client/src/services/apiService.js) - `loginUser()`

```javascript
export const loginUser = async (username, password) => {
    const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.access_token || data.token) {
        const token = data.access_token || data.token;
        const userData = {
            username: data.username,
            token: token,
            userId: data.user_id,
            role: data.role  // ← Stored here
        };
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('authToken', token);
        
        return data;
    } else {
        throw new Error('Login failed: No token received.');
    }
};
```

### Step 4: AuthContext Updates
```javascript
// In AuthContext.jsx login() method
const userData = {
    username: response.username,
    token: response.token,
    userId: response.user_id,
    role: response.role  // ← Now available throughout app
};
setUser(userData);  // Available via useContext(AuthContext)
```

### Step 5: Protected Routes Use Role
```javascript
// Any component can access current user's role:
import { AuthContext } from './AuthContext.jsx';

function MyComponent() {
    const { user } = useContext(AuthContext);
    
    if (user.role === 'admin') {
        return <AdminPanel />;
    }
    return <UserPanel />;
}
```

### Step 6: Backend Checks Permissions
When frontend makes API request with token:

```javascript
// Frontend attaches token to EVERY request
axios.get('/api/protected-endpoint', {
    headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
});
```

Backend processes request:

```python
@app.get("/protected-endpoint")
async def protected_endpoint(
    user_id = Depends(get_current_user_id),  # Extracts user_id from JWT
    _: None = Depends(require_permission("Manage Cameras"))  # Checks permission
):
    # If we reach here, user has "Manage Cameras" permission
    user = await db.user.find_unique(
        where={'id': int(user_id)},
        include={'role': True}
    )
    
    permissions = await get_permission_checker().get_permissions(user.role_id)
    
    return {"status": "success", "data": ...}
```

---

## 5. Token Generation & Validation

### Token Creation
**File:** [server/src/utils/auth.py](server/src/utils/auth.py)

```python
def create_token(user_id: str) -> str:
    payload = {
        'sub': str(user_id),              # Subject = user ID
        'iss': 'agapai-api',              # Issuer
        'aud': 'agapai-client',           # Audience
        'iat': datetime.utcnow(),         # Issued at
        'exp': datetime.utcnow() + timedelta(hours=12),  # Expires in 12 hours
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
```

### Token Validation
```python
def _decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        SECRET_KEY,
        algorithms=['HS256'],
        issuer='agapai-api',       # ← Validates issuer
        audience='agapai-client',  # ← Validates audience
    )

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    token = credentials.credentials
    try:
        payload = _decode_token(token)  # Validates signature, issuer, audience, expiry
        user_id = payload.get('sub')
        
        # Verify account still active (not archived after token issuance)
        user = await db.user.find_unique(where={'id': int(user_id)})
        if not user or not getattr(user, 'is_active', True):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Account is inactive or archived'
            )
        
        return str(user_id)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token has expired'
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid authentication credentials'
        )
```

---

## 6. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AuthContext (stores user + role)                              │
│  ├─ user: { username, userId, role, token }                   │
│  └─ Provides to all components via useContext()               │
│                                                                 │
│  Components                                                     │
│  ├─ ProtectedRoute (guards based on auth)                      │
│  ├─ UserManager (fetches permissions matrix)                   │
│  ├─ useUserManager hook (manages user CRUD)                    │
│  └─ roleUtils (normalize/display roles)                        │
│                                                                 │
│  apiService.js                                                  │
│  ├─ loginUser() → POST /login                                  │
│  ├─ Stores auth token + user data in localStorage             │
│  └─ Attaches token to all API requests                        │
│                                                                 │
└────────────────┬────────────────────────────────────────────────┘
                 │ HTTP/WebSocket
                 │ Bearer <JWT_TOKEN>
                 │
┌────────────────▼────────────────────────────────────────────────┐
│                      BACKEND (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Routes (user_routes.py, etc.)                                 │
│  ├─ POST /login                                                │
│  │  ├─ Calls login_logic() from user_controller.py            │
│  │  ├─ Returns: { access_token, user_id, username, role }    │
│  │  └─ Role normalized (user.role.role_name → lowercase)     │
│  │                                                              │
│  ├─ GET /api/admin/permissions/roles                          │
│  │  ├─ Requires: Superadmin or admin role                     │
│  │  └─ Returns: [{ role_name, permissions {...} }]           │
│  │                                                              │
│  └─ Any Protected Route                                        │
│     ├─ Depends(get_current_user_id)                           │
│     ├─ Depends(require_permission("X"))                        │
│     └─ 403 if user lacks permission                           │
│                                                                 │
│  Auth Utilities (utils/auth.py)                                │
│  ├─ create_token(user_id) → JWT                               │
│  ├─ get_current_user_id() → Extracts user_id from JWT        │
│  ├─ require_admin_user_id() → Validates role ∈ {admin, ...} │
│  └─ require_superadmin_user_id() → Validates role == 'sa'    │
│                                                                 │
│  Permission Utilities (utils/permission_auth.py)              │
│  ├─ require_permission("X") → Check single permission         │
│  ├─ require_any_permission("X", "Y") → Check ANY             │
│  ├─ require_all_permissions("X", "Y") → Check ALL            │
│  └─ get_user_permissions() → Return all granted perms         │
│                                                                 │
│  Permission Service (services/permission_service.py)          │
│  ├─ PermissionCache:                                           │
│  │  ├─ Caches permissions by role_id (2-min TTL)             │
│  │  └─ Merges: CODE defaults + DB overrides + parent inherit │
│  │                                                              │
│  ├─ PermissionChecker:                                         │
│  │  ├─ has_permission(role_id, perm_name) → bool             │
│  │  ├─ has_any_permission(role_id, perms) → bool             │
│  │  └─ get_granted_permissions(role_id) → Set[str]           │
│  │                                                              │
│  └─ Global instances:                                          │
│     ├─ _permission_cache (PermissionCache)                     │
│     └─ _permission_checker (PermissionChecker)                │
│                                                                 │
│  Constants (utils/permission_constants.py)                     │
│  ├─ DEFAULT_PERMISSIONS: Dict[role_name] → Dict[perm] → bool │
│  │  Example:                                                    │
│  │    superadmin: { 'Create Users': True, ... }              │
│  │    admin:      { 'Create Users': True, 'Delete': False }  │
│  │    guard:      { 'Manage Cameras': True, ... }            │
│  │                                                              │
│  └─ ALL_PERMISSIONS: ['Create Users', 'Edit Users', ...]      │
│                                                                 │
│  Database Models (Prisma)                                      │
│  ├─ User: id, username, password, role_id, is_active          │
│  ├─ Role: id, role_name, parent_role_id, ...                 │
│  ├─ RolePermission: role_id, permission_name, is_granted     │
│  └─ PermissionAuditLog: role_id, permission_name, change_by   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Permission Resolution Order

When checking if user has permission "X":

1. **Load from Cache** (2-minute TTL)
   - If fresh, return cached permissions → Done

2. **Load from Database**
   - Query role with `include: { permission_overrides, parent_role }`

3. **Merge Permissions** (in order of precedence):
   ```
   Base         = DEFAULT_PERMISSIONS[role_name]
   With Parent  = if role.parent_role exists:
                    parent_perms = DEFAULT_PERMISSIONS[parent_role_name]
                    + parent.permission_overrides (DB)
                    inherited_perms = parent_perms
   Final        = inherited_perms + role.permission_overrides (DB)
   ```

4. **Check Permission**
   - Return `final_permissions.get("permission_name", False)`

5. **Cache Result** for 2 minutes

---

## 8. Real-Time Permission Updates

When superadmin changes a permission for a role:

```
Frontend (UserManager) 
  → PATCH /api/admin/roles/{role_id}/permissions/{perm_name}
  → Backend updates RolePermission in DB
  → Backend invalidates cache: permission_cache.invalidate(role_id)
  → Backend broadcasts via WebSocket: socket.emit('permissions_updated')
  → Frontend listens: socket.on('permissions_updated', ...)
  → Frontend re-fetches permissions for display
  → All active users see changes instantly
```

---

## 9. Key Files Reference

| File | Purpose |
|------|---------|
| [server/src/utils/permission_auth.py](server/src/utils/permission_auth.py) | Permission dependency checkers for FastAPI |
| [server/src/utils/auth.py](server/src/utils/auth.py) | JWT token creation/validation, auth dependencies |
| [server/src/services/permission_service.py](server/src/services/permission_service.py) | Permission caching & checking logic |
| [server/src/utils/permission_constants.py](server/src/utils/permission_constants.py) | Default role permissions (code-level) |
| [server/src/controllers/user_controller.py](server/src/controllers/user_controller.py) | Login logic, user CRUD operations |
| [server/src/routes/user_routes.py](server/src/routes/user_routes.py) | Login endpoint definition |
| [client/src/components/AuthContext.jsx](client/src/components/AuthContext.jsx) | React context for auth state |
| [client/src/components/ProtectedRoute.jsx](client/src/components/ProtectedRoute.jsx) | Guards routes based on auth |
| [client/src/services/apiService.js](client/src/services/apiService.js) | Login API caller, token management |
| [client/src/utils/roleUtils.js](client/src/utils/roleUtils.js) | Role normalization & display helpers |
| [client/src/hooks/useUserManager.js](client/src/hooks/useUserManager.js) | User CRUD hook |
| [client/src/features/manager/UserManager.jsx](client/src/features/manager/UserManager.jsx) | User management & permission matrix UI |

---

## 10. Summary

- **Authorization Checks:** FastAPI Dependency Injection pattern (`Depends()`) in [permission_auth.py](server/src/utils/permission_auth.py)
- **Permission Logic:** Hybrid system (code defaults + DB overrides) in [permission_service.py](server/src/services/permission_service.py)
- **Frontend Guards:** Role-based conditional rendering + AuthContext provider
- **Data Flow:** Login → JWT token → localStorage → Backend validation → Permission check → Response
- **Real-Time:** WebSocket broadcasts permission changes to all clients instantly
