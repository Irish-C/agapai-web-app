/**
 * src/services/apiService.js
 * Centralized service for REST API calls to the Flask backend.
 *
 * --- UPDATED ---
 * - 'loginUser' now saves the auth token to localStorage.
 * - 'fetchApi' is now EXPORTED and adds the token to the Authorization header.
 * - 'fetchApi' will auto-redirect to '/login' if a 401 is received.
 * - Added 'logoutUser' helper function.
 */

// Base URL is intentionally relative because Vite proxies /api to http://localhost:5000
const BASE_API_URL = '/api';
const AUTH_TOKEN_KEY = 'authToken'; // Key for localStorage

/**
 * Handles all network requests, including error handling.
 * @param {string} endpoint - The API endpoint ('/login').
 * @param {string} method - The HTTP method ('GET').
 * @param {object} [data=null] - JSON data to send in the body.
 * @returns {Promise<object>} The JSON response data.
 */
// --- THIS IS THE FIX ---
// We add the 'export' keyword here so other files can import this function.
export const fetchApi = async (endpoint, method = 'GET', data = null) => {
// --- END FIX ---
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
        // --- DEBUG LOG ---
        // Uncomment this line if you ever have token issues again
        // console.log(`fetchApi: Token value: ${token.substring(0, 10)}...`);
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
            // Don't redirect if we are *on* the login page and the login *fails*
            if (!endpoint.includes('/login')) {
                console.error('fetchApi: 401 Unauthorized. Token is invalid or expired. Redirecting to login.');
                // Use a custom event or state manager in a real app
                // For now, simple redirect
                logoutUser(); // Clear bad token
                window.location.href = '/login'; // Redirect
            }
            // Throw an error to stop the promise chain
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
            return await response.json(); // This is the expected good path
        } else {
            // Handle 204 No Content or non-JSON responses
            return { status: 'success', message: 'Operation successful' };
        }

    } catch (error) {
        console.error('Fetch API Error:', error);
        // Re-throw the error so the calling component's .catch() block can handle it
        throw error;
    }
};


/**
 * Login function.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} User data or error.
 */
export const loginUser = async (username, password) => {
    // --- NEW: Added try...catch for robust login ---
    try {
        const response = await fetchApi('/login', 'POST', { username, password });

        // Check for backend's logical success *and* an access token
        if (response && (response.token || response.access_token)) {
            const token = response.token || response.access_token;
            console.log("loginUser: Login successful, saving token.");
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            return response; // Return the full response data (user, role, etc.)
        } else {
            // This handles cases where login is 200 OK but "status: error"
            throw new Error(response.message || 'Login failed: No token received.');
        }
    } catch (error) {
        console.error("loginUser Error:", error);
        localStorage.removeItem(AUTH_TOKEN_KEY); // Ensure no bad token is left
        throw error; // Re-throw for the LoginPage to catch
    }
};

/**
 * Logout function.
 */
export const logoutUser = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    // We don't redirect here, just clear the token.
    // The component calling this can decide where to redirect.
    console.log("logoutUser: Token removed.");
};

/**
 * Fetches historical event log data for the ReportsPage.
 * @returns {Promise<object>} Time-series data.
 */
export const fetchReportsData = () => {
    return fetchApi('/event_logs', 'GET');
};


/**
 * Fetches the list of all active cameras from the backend.
 * @returns {Promise<object>} API response with camera list.
 */
export const fetchCameraList = () => {
    // This now calls your real backend endpoint from app.py
    return fetchApi('/camera_status', 'GET');
}

/**
 * Fetches event logs for today from the backend database.
 * @returns {Promise<object>} API response with today's logs.
 */
export const fetchTodayEventLogs = () => {
    return fetchApi('/event_logs/today', 'GET');
};