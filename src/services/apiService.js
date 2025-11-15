// src/services/apiService.js
// Centralized service for REST API calls to the Flask backend.

// Base URL is intentionally relative because Vite proxies /api to http://localhost:5000
const BASE_API_URL = '/api';
const AUTH_TOKEN_KEY = 'authToken'; // Key for localStorage

/**
 * Handles all network requests, including error handling and token injection.
 * @param {string} endpoint - The API endpoint (e.g., '/login').
 * @param {string} method - The HTTP method ('GET', 'POST').
 * @param {object} [data=null] - JSON data to send in the body.
 * @returns {Promise<object>} The JSON response data.
 */
export const fetchApi = async (endpoint, method = 'GET', data = null) => {
    const url = `${BASE_API_URL}${endpoint}`;
    
    // --- DEBUG LOG ---
    console.log(`fetchApi: Requesting ${endpoint}...`);
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // 1. Get token from localStorage
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.log(`fetchApi: No token found in localStorage for ${endpoint}.`);
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        // 2. Check for 401 Unauthorized
        if (response.status === 401) {
            // Only redirect if a protected resource failed
            if (!endpoint.includes('/login')) {
                console.error('fetchApi: 401 Unauthorized. Token is invalid or expired. Redirecting to login.');
                logoutUser(); // Clear bad token
                window.location.href = '/login'; // Redirect
            }
            throw new Error("Authentication failed or expired.");
        }

        if (!response.ok) {
            // Try to parse error message from backend
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.message || errorData.msg || `HTTP error! status: ${response.status} for ${url}`;
            console.error('API Error Response:', errorData);
            throw new Error(message);
        }

        // 3. Handle successful response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json(); 
        } else {
            return { status: 'success', message: 'Operation successful' };
        }

    } catch (error) {
        console.error('Fetch API Error:', error);
        throw error;
    }
};


/**
 * Login function.
 */
export const loginUser = async (username, password) => {
    try {
        const response = await fetchApi('/login', 'POST', { username, password });

        if (response && (response.token || response.access_token)) {
            const token = response.token || response.access_token;
            console.log("loginUser: Login successful, saving token.");
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

/**
 * Logout function.
 */
export const logoutUser = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log("logoutUser: Token removed.");
};

/**
 * Fetches historical event log data for the ReportsPage.
 */
export const fetchReportsData = () => {
    return fetchApi('/event_logs', 'GET');
};


/**
 * Fetches the list of all active cameras from the backend.
 */
export const fetchCameraList = () => {
    return fetchApi('/camera_status', 'GET');
}

/**
 * Fetches event logs for today from the backend database.
 */
export const fetchTodayEventLogs = () => {
    return fetchApi('/event_logs/today', 'GET');
};

/**
 * Fetches the 24-hour activity summary data.
 * @returns {Promise<object>} e.g., { moving_time: 400, resting_time: 600, incident_count: 5 }
 */
export const fetchDailySummary = () => {
    return fetchApi('/summary/daily', 'GET');
};