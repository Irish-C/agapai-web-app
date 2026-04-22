// --- CONTACT SUPPORT SERVICE ---
export const contactSupport = (data) => {
    return fetchApi('/contact', 'POST', data);
};
// src/services/apiService.js

const BASE_API_URL = 'http://localhost:5000/api';
const AUTH_TOKEN_KEY = 'authToken'; 

/**
 * Generic fetch function with error handling and token management.
 * This is the engine for all API calls in the AGAPAI system.
 */
export const fetchApi = async (endpoint, method = 'GET', data = null) => {
    const base = String(BASE_API_URL).replace(/\/+$/, '');
    const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    console.log(`fetchApi: Requesting ${method} ${endpoint}...`);

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
        console.log(`fetchApi: Token found - ${token.substring(0, 20)}...`);
    } else {
        console.warn(`fetchApi: No token found for endpoint ${endpoint}`);
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        // Handle 401 Unauthorized (Expired or missing token)
        if (response.status === 401) {
            const isAuthAttempt = endpoint.includes('/login');
            const isPasswordChange = endpoint.includes('/change-password');
            const isCameraRequest = endpoint.includes('/cameras');
            const isNonCritical = endpoint.includes('/events') || endpoint.includes('/logs');

            // Only logout on 401 for critical auth endpoints, not for data fetches
            if (!isAuthAttempt && !isPasswordChange && !isCameraRequest && !isNonCritical) {
                console.error('fetchApi: Session expired. Redirecting to login.');
                logoutUser(); 
                window.location.href = '/login'; 
            }
            
            // Still throw the error so the Component can catch it and show the message
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Incorrect credentials or expired session.");
        }

        // Handle non-2xx responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.message || errorData.msg || `HTTP error! status: ${response.status}`;
            console.error('API Error Response:', errorData);
            throw new Error(message);
        }

        // Attempt to parse JSON response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const jsonResponse = await response.json();
            
            // Log acknowledge/unacknowledge responses for debugging
            if (endpoint.includes('/events/') && endpoint.includes('/acknowledge')) {
                console.log(`fetchApi: ${endpoint} response:`, jsonResponse);
            }
            
            return jsonResponse;
        } else {
            return { status: 'success', message: 'Operation successful' };
        }
    } catch (error) {
        console.error('Fetch API Error:', error);
        throw error;
    }
};

// --- AUTHENTICATION SERVICES ---

export const loginUser = async (username, password) => {
    try {
        const response = await fetchApi('/login', 'POST', { username, password });

        if (response && (response.access_token || response.token)) {
            const token = response.access_token || response.token;
            console.log('loginUser: Token received from login:', token.substring(0, 20) + '...');
            
            const userData = {
                username: response.username,
                token: token,
                userId: response.user_id,
                role: response.role
            };

            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem(AUTH_TOKEN_KEY, token); 
            console.log('loginUser: Token saved to localStorage');
            
            return response;
        } else {
            throw new Error('Login failed: No token received.');
        }
    } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem(AUTH_TOKEN_KEY);
        throw error; 
    }
};

export const logoutUser = () => {
    localStorage.removeItem('user');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log("logoutUser: Session cleared.");
};

// --- USER MANAGEMENT SERVICES ---

export const fetchUsers = (options = {}) => {
    const params = new URLSearchParams();
    if (options.includeArchived) params.append('include_archived', 'true');
    if (options.archivedOnly) params.append('archived_only', 'true');
    const qs = params.toString();
    const endpoint = qs ? `/users?${qs}` : '/users';
    return fetchApi(endpoint, 'GET');
};

/**
 * Handles both creating a new user (POST) and updating an existing one (PUT).
 */
export const saveUserApi = async (userData) => {
    if (userData.id) {
        // Update existing user
        return fetchApi(`/users/${userData.id}`, 'PUT', userData);
    } else {
        // Create new user
        return fetchApi('/users', 'POST', userData);
    }
};

/**
 * Fetches the dynamic list of roles from the database.
 */
export const fetchRolesApi = () => {
    return fetchApi('/roles', 'GET');
};

export const archiveUser = (userId) => {
    return fetchApi(`/users/${userId}/archive`, 'PATCH', { is_active: false }); 
};

export const changePassword = (oldPassword, newPassword) => {
    return fetchApi('/users/change-password', 'POST', { 
        old_password: oldPassword, 
        new_password: newPassword 
    });
};

export const fetchUserProfile = () => {
    return fetchApi('/user/profile', 'GET');
};

// --- DASHBOARD & REPORTS SERVICES ---

export const fetchCameraList = () => {
    return fetchApi('/cameras', 'GET');
}

export const fetchCameraConfig = () => {
    return fetchApi('/settings/camera', 'GET');
}

export const fetchDailySummary = () => {
    return fetchApi('/summary/daily', 'GET');
};

export const fetchReportsData = (limit, startDate, endDate) => {
    const params = new URLSearchParams({ limit });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    params.append('tz_offset_minutes', String(new Date().getTimezoneOffset()));

    return fetchApi(`/event_logs?${params.toString()}`, 'GET');
};

// --- CAMERA DETECTION CONTROL (Single Camera Mode) ---

export const startCameraDetection = () => {
    return fetchApi('/settings/camera/start', 'POST');
};

export const stopCameraDetection = () => {
    return fetchApi('/settings/camera/stop', 'POST');
};