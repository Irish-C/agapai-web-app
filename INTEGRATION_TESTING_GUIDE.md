# Feature Authorization System - Integration Testing Guide

## 🎯 Objective

Verify that the feature authorization system works end-to-end across:
1. Backend route protection
2. Frontend feature discovery
3. UI feature enforcement
4. User role access control

---

## 🚀 Getting Started

### Prerequisites

Ensure you have:
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:5173`
- Test user accounts in the database
- Chrome/Firefox DevTools for network inspection

### Start the Servers

**Terminal 1 - Backend**:
```bash
cd server
python3 app.py
```

Expected output:
```
✓ Uvicorn running on http://127.0.0.1:5000
✓ Press CTRL+C to shutdown
```

**Terminal 2 - Frontend**:
```bash
cd client
npm run dev
```

Expected output:
```
✓ VITE v5.x ready in xxx ms
✓ Local: http://localhost:5173/
```

**Terminal 3 - Run Tests** (Optional):
```bash
bash run_integration_tests.sh
```

---

## 📋 Test Scenarios

### Test 1: Login Flow & Feature Discovery

**Steps**:
1. Open http://localhost:5173
2. Login with test account (e.g., superadmin/password)
3. Open DevTools → Network tab
4. Observe network requests during/after login

**Expected Results**:
- ✓ Login successful, redirected to dashboard
- ✓ `/api/admin/features/me` called automatically (200 OK)
- ✓ Features cached in localStorage
- ✓ No errors in console

**Verify in Console**:
```javascript
// Check localStorage
localStorage.getItem('userFeatures')
// Should return: {"view_cameras": true, "add_camera": true, ...}

// Check AuthContext (if exposed)
window.authContext?.features
```

---

### Test 2: Settings Page - Feature-Based Navigation

**Steps**:
1. Login as SuperAdmin (should see all sections)
2. Go to Settings page
3. Observe which navigation sections are visible
4. Logout and login as Admin
5. Check which sections are now hidden

**Expected Results**:

**SuperAdmin** (26/26 features):
- ✓ My Account
- ✓ Device and Location
- ✓ Notifications
- ✓ User Management
- ✓ Role Permissions
- ✓ Audit Log

**Admin** (18/26 features):
- ✓ My Account
- ✓ Device and Location
- ✓ Notifications
- ✓ User Management
- ✗ Role Permissions (hidden)
- ✗ Audit Log (hidden)

**Caregiver** (8/26 features):
- ✓ My Account
- ✓ Notifications
- ✗ Device and Location (hidden)
- ✗ User Management (hidden)
- ✗ Role Permissions (hidden)
- ✗ Audit Log (hidden)

---

### Test 3: User Management - Button Visibility

**Steps**:
1. Login as Admin (should have all user management features)
2. Go to Settings → User Management
3. Observe "Add New User" button is visible
4. Observe Edit/Archive buttons on each user row
5. Logout and login as Caregiver (limited features)
6. Try to access Settings → User Management

**Expected Results**:

**Admin**:
- ✓ "Add New User" button is visible
- ✓ Edit button on each user row is clickable
- ✓ Archive button on each user row is visible

**Caregiver**:
- ✓ Settings → User Management is NOT in navigation
- ✓ If accessed directly, shows "Access Denied"

---

### Test 4: Account Settings - Password Change

**Steps**:
1. Login as different roles
2. Go to Settings → My Account
3. Observe password change section

**Expected Results**:

**All roles with `change_password` feature**:
- ✓ "Security Settings" section visible
- ✓ Old/New Password fields visible
- ✓ "Save New Password" button is active

**Roles without `change_password` feature** (if any):
- ✓ Password section shows "Access Denied" message
- ✓ Input fields are not visible

---

### Test 5: Notification Settings Access

**Steps**:
1. Login as Admin
2. Go to Settings → Notifications
3. Verify settings load and are editable
4. Logout and login as Guard (different feature set)
5. Check if Notifications section loads

**Expected Results**:

**Users with `view_settings` feature**:
- ✓ Notification settings load
- ✓ Toggle switches are visible
- ✓ Can modify settings

**Users without `view_settings` feature**:
- ✓ Shows "Access Denied" message
- ✓ Settings don't load

---

### Test 6: API Protection - Unauthorized Access

**Steps**:
1. Open DevTools → Network tab
2. Get auth token from login
3. Test various API endpoints with CURL or Postman

**Test Cases**:

```bash
# Get a valid token first
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"testuser","password":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Test 1: UnAuthorized request (no token)
curl -i http://localhost:5000/api/cameras
# Expected: 403 Forbidden or 401 Unauthorized

# Test 2: Valid token, has feature
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/cameras
# Expected: 200 OK or 400 (data validation, not auth)

# Test 3: Valid token, missing feature (use token from limited role)
# Login as 'caregiver' (limited features), try to access admin endpoint
TOKEN_LIMITED=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"caregiver","password":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -i -H "Authorization: Bearer $TOKEN_LIMITED" http://localhost:5000/api/users
# Expected: 403 Forbidden (not enough features)
```

**Expected Results**:
- ✓ No auth → 401/403
- ✓ Valid auth, has feature → 200 or 400 (business logic)
- ✓ Valid auth, missing feature → 403 Forbidden
- ✓ Invalid token → 401 Unauthorized

---

### Test 7: Feature Matrix Verification

**Steps**:
1. Get superadmin token
2. Call `/api/admin/features/`
3. Verify all features are returned
4. Check feature structure

**Request**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/features/
```

**Expected Response**:
```json
{
  "my_account": [
    {
      "feature_key": "view_profile",
      "feature_name": "View Profile",
      "description": "..."
    },
    // ... more features
  ],
  "device_location": [
    {
      "feature_key": "view_cameras",
      "feature_name": "View Cameras",
      "description": "..."
    },
    // ...
  ],
  // ... other categories
}
```

**Verification**:
- ✓ 7 categories returned
- ✓ 26 total features
- ✓ Each feature has: `feature_key`, `feature_name`, `description`
- ✓ Categories are organized logically

---

### Test 8: User Features Endpoint

**Steps**:
1. Login as different users
2. Call `/api/admin/features/me`
3. Compare results across roles

**Request**:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/features/me
```

**Expected Response** (varies by role):

SuperAdmin:
```json
{
  "view_profile": true,
  "edit_profile": true,
  "change_password": true,
  "view_settings": true,
  // ... all 26 true
}
```

Caregiver:
```json
{
  "view_profile": true,
  "edit_profile": true,
  "change_password": true,
  "view_settings": true,
  "configure_email": true,
  "configure_alerts": true,
  "view_cameras": false,
  "add_camera": false,
  // ... only 8 true
}
```

**Verification**:
- ✓ SuperAdmin has all features true
- ✓ Admin has ~18 features true
- ✓ Supervisor has ~13 features true
- ✓ Guard has ~10 features true
- ✓ Caregiver has ~8 features true

---

## 🔍 Debugging Commands

### Check Backend Logs

```bash
# Look for feature-related log messages
# Should see: "GET /api/admin/features/me" requests

# Look for auth failures on protected routes
# Should see: "403 Forbidden" for missing features
```

### Chrome DevTools Tricks

**Network Tab**:
```
Filter by "features" → see feature API calls
Filter by "user" → see user-related API calls
Look for response codes: 200 (success), 403 (forbidden), 401 (unauthorized)
```

**Console Tab**:
```javascript
// Check localStorage
Object.keys(localStorage)
// Should include: authToken, userFeatures, etc.

// Check network requests
console.log('User features:', localStorage.getItem('userFeatures'))

// Check component state (if using React DevTools)
// Look for AuthContext.features in React Profiler
```

**Application Tab**:
```
Storage → Local Storage → http://localhost:5173
Look for:
  • authToken (JWT)
  • userFeatures (JSON object with feature visibility)
  • userId (user's ID)
```

---

## ✅ Checklist for Successful Integration

### Backend Verification
- [ ] Server starts without errors
- [ ] All Python files compile (no syntax errors)
- [ ] `/api/admin/features/` endpoint returns 403 without auth
- [ ] `/api/admin/features/me` endpoint works with valid token
- [ ] Protected routes return 403 for missing features
- [ ] Protected routes return 200 for users with features

### Frontend Verification
- [ ] App loads without errors
- [ ] Login works with test credentials
- [ ] Features fetch automatically on login
- [ ] Dropdown shows all features for superadmin
- [ ] Dropdown hides features for limited roles
- [ ] Buttons show/hide based on features
- [ ] "Access Denied" messages appear appropriately

### Feature Enforcement
- [ ] Settings navigation adapts to role
- [ ] User Management shows/hides buttons based on features
- [ ] Account Settings shows/hides password section
- [ ] Notification Settings shows/hides based on features
- [ ] User table edit/archive buttons appear correctly

### Security
- [ ] Unauthenticated requests return 401/403
- [ ] Limited users get 403 for admin endpoints
- [ ] Frontend and backend feature lists match
- [ ] localStorage clears on logout
- [ ] Token is included in all protected API calls

---

## 🐛 Common Issues & Fixes

### Issue: "User features not loading"
**Solution**:
1. Check network tab for `/api/admin/features/me` request
2. Verify request includes `Authorization: Bearer TOKEN`
3. Check server logs for errors
4. Reload page to retry feature fetch

### Issue: "Button should be hidden but it's visible"
**Solution**:
1. Verify user's role and features
2. Check localStorage: `localStorage.getItem('userFeatures')`
3. Look for console errors in DevTools
4. Hard refresh page (Ctrl+Shift+R)

### Issue: "API allows unauthorized access"
**Solution**:
1. Check that route has `Depends(require_feature(...))`
2. Verify feature_auth.py is imported
3. Check server logs for auth failures
4. Restart backend server

### Issue: "Frontend can't reach backend"
**Solution**:
1. Verify backend is running: `curl http://localhost:5000`
2. Check CORS configuration in app.py
3. Verify API URL in frontend (.env or apiService.js)
4. Check for firewall/network issues

---

## 📊 Test Results Template

Use this to document your testing:

```markdown
## Integration Test Results - [Date]

### Server Status
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] Both servers responding to requests

### Test 1: Login & Feature Discovery
- [ ] PASS / [ ] FAIL
  Notes: _______________

### Test 2: Settings Navigation
- [ ] PASS / [ ] FAIL
  Notes: _______________

### Test 3: User Management
- [ ] PASS / [ ] FAIL
  Notes: _______________

### Test 4: Account Settings
- [ ] PASS / [ ] FAIL
  Notes: _______________

### Test 5: API Protection
- [ ] PASS / [ ] FAIL
  Notes: _______________

### Test 6: Feature Matrix
- [ ] PASS / [ ] FAIL
  Notes: _______________

### Overall Status
- [ ] ALL TESTS PASS - Ready for deployment
- [ ] SOME ISSUES - Needs fixes
- [ ] MAJOR ISSUES - Blocking deployment
```

---

## 🎓 Learning Resources

### Key Files to Review
1. **Backend**: `server/src/utils/feature_auth.py` - Authorization logic
2. **Frontend**: `client/src/hooks/useUserFeatures.js` - Feature hook
3. **Routes**: `server/src/routes/{camera,location,user}_routes.py` - Protected endpoints
4. **Components**: `client/src/pages/SettingsPage.jsx` - Feature-based UI

### Documentation
- `QUICK_START_FEATURE_AUTHORIZATION.md` - Quick reference
- `FEATURE_AUTHORIZATION_IMPLEMENTATION_UPDATE.md` - Detailed implementation
- `TESTING_UI_UPDATES_SUMMARY.md` - UI component summary

---

## 📞 Support

For issues or questions:
1. Check the documentation files listed above
2. Review server logs: `/home/maryc/agapai-web-app/server` console
3. Check browser console for frontend errors
4. Run `bash run_integration_tests.sh` for automated checks

Good luck! 🚀
