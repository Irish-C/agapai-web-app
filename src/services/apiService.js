// src/services/apiService.js

// Base URL is intentionally relative because Vite proxies /api to http://localhost:5000
const BASE_API_URL = '/api';
const AUTH_TOKEN_KEY = 'authToken'; 


// Export the user fetching function
export const fetchUsers = () => {
    return fetchApi('/users', 'GET'); 
};

// Generic fetch function with error handling and token management
export const fetchApi = async (endpoint, method = 'GET', data = null) => {
    const url = `${BASE_API_URL}${endpoint}`;
    
    console.log(`fetchApi: Requesting ${endpoint}...`);
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) { // Attach token if available
        options.headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.log(`fetchApi: No token found in localStorage for ${endpoint}.`);
    }
    if (data) { // Attach body data for POST/PUT/PATCH
        options.body = JSON.stringify(data);
    }
    try { // Perform the fetch
        const response = await fetch(url, options);

        if (response.status === 401) {
            if (!endpoint.includes('/login')) {
                console.error('fetchApi: 401 Unauthorized. Redirecting to login.');
                logoutUser(); 
                window.location.href = '/login'; 
            }
            throw new Error("Authentication failed or expired.");
        }

        // Handle non-2xx responses
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.message || errorData.msg || `HTTP error! status: ${response.status} for ${url}`;
            console.error('API Error Response:', errorData);
            throw new Error(message);
        }

        // Attempt to parse JSON response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json(); 
        } else {
            return { status: 'success', message: 'Operation successful' };
        }
    // Catch network or parsing errors
    } catch (error) {
        console.error('Fetch API Error:', error);
        throw error;
    }
};

// Login function that saves token to localStorage
export const loginUser = async (username, password) => {
    try {
        const response = await fetchApi('/login', 'POST', { username, password });

        // Check for token in response
        if (response && (response.token || response.access_token)) {
            const token = response.token || response.access_token;
            console.log("loginUser: Login successful, saving token.");
            
            // Ensure any previous token is cleared before setting the new one
            localStorage.removeItem(AUTH_TOKEN_KEY); 
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            
            return response;
        } else {
            throw new Error(response.message || 'Login failed: No token received.');
        }
    } catch (error) {
        console.error("loginUser Error:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY); 
        throw error; 
    }
};

// Logout function that removes token from localStorage
export const logoutUser = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log("logoutUser: Token removed.");
};

// Fetch camera list for CameraGrid component
export const fetchCameraList = () => {
    return fetchApi('/camera_status', 'GET');
}

// Fetch daily summary data for DashboardPage
export const fetchDailySummary = () => {
    return fetchApi('/summary/daily', 'GET');
};

/**
 * Fetches historical event log data for the ReportsPage, applying a limit and date filters.
 * @param {number} limit - The maximum number of logs to return (20, 50, 100).
 * @param {string} startDate - Optional start date for filtering (format: YYYY-MM-DD).
 * @param {string} endDate - Optional end date for filtering (format: YYYY-MM-DD).
 */
export const fetchReportsData = (limit, startDate, endDate) => {
    
    // Start with the base query parameters for limit
    const params = new URLSearchParams({
        limit: limit,
    });

    // Add start_date parameter if startDate is provided (not an empty string)
    if (startDate) {
        params.append('start_date', startDate);
    }

    // Add end_date parameter if endDate is provided (not an empty string)
    if (endDate) {
        params.append('end_date', endDate);
    }

    // Construct the final URL with all parameters
    // The resulting URL will look like: /event_logs?limit=20&start_date=2025-01-01
    return fetchApi(`/event_logs?${params.toString()}`, 'GET');
};

// Fetch user profile data
export const fetchUserProfile = () => {
    return fetchApi('/user/profile', 'GET');
};

// Change user password
export const changePassword = (oldPassword, newPassword) => {
    return fetchApi('/users/change-password', 'POST', { 
        old_password: oldPassword, 
        new_password: newPassword 
    });
};

// Archive (deactivate) a user
export const archiveUser = (userId) => {
    // backend route to set is_active=False
    return fetchApi(`/users/${userId}/archive`, 'PATCH', { is_active: false }); 
};