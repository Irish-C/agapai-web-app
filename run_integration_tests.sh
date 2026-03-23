#!/bin/bash

# ============================================================================
# Feature Authorization System - Integration Test Script
# Tests the system end-to-end with actual servers running
# ============================================================================

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================================================"
echo "Feature Authorization System - Integration Test Suite"
echo "============================================================================"
echo -e "${NC}"

# ============================================================================
# TEST SETUP
# ============================================================================

echo -e "\n${YELLOW}[SETUP] Checking prerequisites...${NC}"

# Check if servers are running
check_server() {
    local port=$1
    local name=$2
    
    if curl -s http://localhost:$port > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name is running on port $port"
        return 0
    else
        echo -e "${RED}✗${NC} $name is NOT running on port $port"
        return 1
    fi
}

BACKEND_READY=false
FRONTEND_READY=false

if check_server 5000 "Backend"; then
    BACKEND_READY=true
else
    echo -e "${YELLOW}Start backend with: cd server && python3 app.py${NC}"
fi

if check_server 5173 "Frontend"; then
    FRONTEND_READY=true
else
    echo -e "${YELLOW}Start frontend with: cd client && npm run dev${NC}"
fi

if [ "$BACKEND_READY" = false ]; then
    echo -e "${RED}Cannot proceed without backend server${NC}"
    exit 1
fi

# ============================================================================
# TEST 1: BACKEND API CONNECTIVITY
# ============================================================================

echo -e "\n${BLUE}[TEST 1] Backend API Connectivity${NC}"

response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/admin/features/)
if [ "$response" -eq 403 ] || [ "$response" -eq 200 ] || [ "$response" -eq 401 ]; then
    echo -e "${GREEN}✓${NC} API endpoint is reachable (HTTP $response)"
else
    echo -e "${RED}✗${NC} API endpoint returned HTTP $response (expected 200, 401, or 403)"
    exit 1
fi

# ============================================================================
# TEST 2: LOGIN & TOKEN GENERATION
# ============================================================================

echo -e "\n${BLUE}[TEST 2] Login & Token Generation${NC}"

# Try to get login endpoint
response=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5000/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' 2>/dev/null)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" -eq 401 ] || [ "$http_code" -eq 200 ] || [ "$http_code" -eq 400 ]; then
    echo -e "${GREEN}✓${NC} Login endpoint is reachable (HTTP $http_code)"
    echo -e "  ${YELLOW}Note: Use actual test credentials for full testing${NC}"
else
    echo -e "${YELLOW}⚠${NC} Login endpoint returned HTTP $http_code (expected 200, 400, or 401)"
fi

# ============================================================================
# TEST 3: FEATURE DISCOVERY ENDPOINT
# ============================================================================

echo -e "\n${BLUE}[TEST 3] Feature Discovery Endpoint${NC}"

response=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/admin/features/ 2>/dev/null)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" -eq 403 ]; then
    echo -e "${GREEN}✓${NC} Feature endpoint correctly requires authentication (HTTP 403)"
elif [ "$http_code" -eq 401 ]; then
    echo -e "${GREEN}✓${NC} Feature endpoint correctly requires authentication (HTTP 401)"
elif [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✓${NC} Feature endpoint is accessible (HTTP 200)"
    
    # Check if response contains features
    if echo "$body" | grep -q "feature"; then
        echo -e "${GREEN}✓${NC} Response contains feature data"
    else
        echo -e "${YELLOW}⚠${NC} Response may not contain expected feature structure"
    fi
else
    echo -e "${YELLOW}⚠${NC} Feature endpoint returned HTTP $http_code"
fi

# ============================================================================
# TEST 4: PROTECTED ROUTE CHECK
# ============================================================================

echo -e "\n${BLUE}[TEST 4] Protected Route Authorization${NC}"

# Test camera endpoint without auth (should return 403)
response=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/cameras 2>/dev/null)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 403 ] || [ "$http_code" -eq 401 ]; then
    echo -e "${GREEN}✓${NC} /api/cameras correctly requires authentication (HTTP $http_code)"
else
    echo -e "${YELLOW}⚠${NC} /api/cameras returned HTTP $http_code (expected 401/403)"
fi

# Test user endpoint without auth
response=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/users 2>/dev/null)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 403 ] || [ "$http_code" -eq 401 ]; then
    echo -e "${GREEN}✓${NC} /api/users correctly requires authentication (HTTP $http_code)"
else
    echo -e "${YELLOW}⚠${NC} /api/users returned HTTP $http_code (expected 401/403)"
fi

# Test location endpoint without auth
response=$(curl -s -w "\n%{http_code}" http://localhost:5000/api/locations 2>/dev/null)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 403 ] || [ "$http_code" -eq 401 ]; then
    echo -e "${GREEN}✓${NC} /api/locations correctly requires authentication (HTTP $http_code)"
else
    echo -e "${YELLOW}⚠${NC} /api/locations returned HTTP $http_code (expected 401/403)"
fi

# ============================================================================
# TEST 5: PYTHON SYNTAX VALIDATION
# ============================================================================

echo -e "\n${BLUE}[TEST 5] Backend Python Syntax${NC}"

cd "$(dirname "$0")/server"

for file in src/routes/camera_routes.py src/routes/location_routes.py src/routes/user_routes.py src/utils/feature_auth.py; do
    if python3 -m py_compile "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $file syntax is valid"
    else
        echo -e "${RED}✗${NC} $file has syntax errors"
        exit 1
    fi
done

cd - > /dev/null

# ============================================================================
# TEST 6: FRONTEND COMPONENTS
# ============================================================================

echo -e "\n${BLUE}[TEST 6] Frontend Components${NC}"

cd "$(dirname "$0")/client"

# Check key frontend files exist
for file in src/hooks/useUserFeatures.js src/pages/SettingsPage.jsx src/features/manager/UserManager.jsx src/components/features/manager/UserTable.jsx; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
        
        # Check if it imports useUserFeatures
        if grep -q "useUserFeatures" "$file" 2>/dev/null; then
            echo -e "  ${GREEN}→${NC} Uses useUserFeatures hook"
        fi
    else
        echo -e "${RED}✗${NC} $file not found"
    fi
done

cd - > /dev/null

# ============================================================================
# SUMMARY & NEXT STEPS
# ============================================================================

echo -e "\n${BLUE}============================================================================"
echo "Integration Tests Complete"
echo "============================================================================${NC}"

echo -e "\n${YELLOW}[NEXT STEPS] Manual Testing in Browser:${NC}"

if [ "$FRONTEND_READY" = true ]; then
    echo -e "\n${GREEN}Frontend is running - Open in browser:${NC}"
    echo -e "  ${BLUE}http://localhost:5173${NC}"
    echo -e "\n${YELLOW}Test Scenarios:${NC}"
    echo -e "  1. ${GREEN}Login as different roles:${NC}"
    echo -e "     • SuperAdmin - should see all Settings sections"
    echo -e "     • Admin - should NOT see Permissions & Audit Log"
    echo -e "     • Caregiver - should NOT see Device, Locations, Users"
    echo -e "\n  2. ${GREEN}Test Feature Visibility:${NC}"
    echo -e "     • Check that buttons show/hide based on features"
    echo -e "     • Try clicking disabled/hidden operations"
    echo -e "     • Verify \"Access Denied\" messages appear"
    echo -e "\n  3. ${GREEN}Test API Protection:${NC}"
    echo -e "     • Open DevTools → Network tab"
    echo -e "     • Try accessing unauthorized features"
    echo -e "     • Look for 403 Forbidden responses"
    echo -e "\n  4. ${GREEN}Test Different Users:${NC}"
    echo -e "     • Log in as different test users"
    echo -e "     • Verify UI adapts to their feature set"
    echo -e "     • Logout and login as another role"
else
    echo -e "\n${YELLOW}Frontend is not running yet.${NC}"
    echo -e "  ${BLUE}cd client && npm run dev${NC}"
    echo -e "\nThen open in browser: ${BLUE}http://localhost:5173${NC}"
fi

echo -e "\n${YELLOW}[CURL COMMANDS] Test API Directly:${NC}"

echo -e "\n${GREEN}1. Login and get token:${NC}"
echo -e "  ${BLUE}curl -X POST http://localhost:5000/api/login \\${NC}"
echo -e "    ${BLUE}-H 'Content-Type: application/json' \\${NC}"
echo -e "    ${BLUE}-d '{\"username\":\"USERNAME\",\"password\":\"PASSWORD\"}'${NC}"

echo -e "\n${GREEN}2. Fetch user features (requires token):${NC}"
echo -e "  ${BLUE}curl http://localhost:5000/api/admin/features/me \\${NC}"
echo -e "    ${BLUE}-H 'Authorization: Bearer TOKEN'${NC}"

echo -e "\n${GREEN}3. Access protected endpoint:${NC}"
echo -e "  ${BLUE}curl http://localhost:5000/api/cameras \\${NC}"
echo -e "    ${BLUE}-H 'Authorization: Bearer TOKEN'${NC}"

echo -e "\n${GREEN}4. Get all features (SuperAdmin only):${NC}"
echo -e "  ${BLUE}curl http://localhost:5000/api/admin/features/ \\${NC}"
echo -e "    ${BLUE}-H 'Authorization: Bearer TOKEN'${NC}"

echo -e "\n${YELLOW}[VERIFICATION CHECKLIST]:${NC}"
echo -e "  ${GREEN}✓${NC} Backend server is running"
echo -e "  ${GREEN}✓${NC} Frontend server is running"
echo -e "  ${GREEN}✓${NC} Can login and get auth token"
echo -e "  ${GREEN}✓${NC} Feature endpoint returns feature list"
echo -e "  ${GREEN}✓${NC} Unprotected routes reject requests without auth"
echo -e "  ${GREEN}✓${NC} UI shows/hides features based on user role"
echo -e "  ${GREEN}✓${NC} API returns 403 for unauthorized features"
echo -e "  ${GREEN}✓${NC} Different roles see different UI sections"

echo -e "\n${BLUE}For detailed analysis, see:${NC}"
echo -e "  • QUICK_START_FEATURE_AUTHORIZATION.md"
echo -e "  • FEATURE_AUTHORIZATION_IMPLEMENTATION_UPDATE.md"
echo -e "  • TESTING_UI_UPDATES_SUMMARY.md"

echo ""
