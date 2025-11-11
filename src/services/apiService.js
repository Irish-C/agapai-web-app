/**
 * src/services/apiService.js
 * Centralized service for REST API calls to the Flask backend.
 *
 * --- UPDATED ---
 * - 'fetchApi' 401 handler now ignores '/login' to prevent loops.
 * - 'loginUser' now has a robust try/catch block.
 * - Added console.log debugging to 'fetchApi' to check token status.
 */

// Base URL is intentionally relative because Vite proxies /api to http://localhost:5000
const BASE_API_URL = '/api';

// Define the key for storing the token
const AUTH_TOKEN_KEY = 'authToken';

/**
 * Handles all network requests, including error handling.
 * @param {string} endpoint - The API endpoint ('/login').
 * @param {string} method - The HTTP method ('GET').
 * @param {object} [data=null] - JSON data to send in the body.
 * @returns {Promise<object>} The JSON response data.
 */
const fetchApi = async (endpoint, method = 'GET', data = null) => {
    const url = `${BASE_API_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
    };

    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    // --- NEW: Debugging Logs ---
    console.log(`fetchApi: Requesting ${endpoint}...`);
    if (token) {
        console.log("fetchApi: Token found, attaching to Authorization header.");
        // Uncomment the line below if you need to see the token value (be careful with this in production!)
        // console.log("fetchApi: Token value:", token); 
        headers['Authorization'] = `Bearer ${token}`;
    } else {
        console.warn(`fetchApi: No token found in localStorage for ${endpoint}.`);
    }
    // --- END NEW ---

    const options = {
        method,
        headers,
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            // --- NEW: Prevent redirect loop ---
            // Don't redirect if the 401 error came from the login page itself.
            if (endpoint !== '/login') {
                console.error("fetchApi: 401 Unauthorized. Token is invalid or expired. Logging out.");
                localStorage.removeItem(AUTH_TOKEN_KEY);
                window.location.href = '/login';
                throw new Error("Authentication failed or expired. Please log in again.");
            }
            // --- END NEW ---
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.message || `HTTP error! status: ${response.status} for ${url}`;
            console.error('API Error Response:', errorData);
            throw new Error(message);
        }

        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json();
        } else {
            return {};
        }

    } catch (error) {
        // Don't re-log the error if it's the one we just threw
        if (error.message.includes("Authentication failed")) {
            throw error;
        }
        console.error('Fetch API Error:', error);
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
    // --- NEW: Robust try/catch for login ---
    try {
        // fetchApi will now throw an error if login fails (e.g., 401)
        const response = await fetchApi('/login', 'POST', { username, password });

        if (response && response.access_token) {
            console.log("loginUser: Login successful, saving token.");
            localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
            return response;
        } else {
            // This happens if the server gives a 200 OK but no token
            console.warn("loginUser: Login response OK, but no 'access_token' found in response.", response);
            throw new Error("Login failed: Server did not return an access token.");
        }
    } catch (error) {
        // This will catch 401s (invalid credentials) or other fetch errors
        console.error("loginUser: Login failed.", error.message);
        // Clear any old, invalid tokens just in case
        localStorage.removeItem(AUTH_TOKEN_KEY);
        // Re-throw the error so the LoginPage UI can display it
        throw error;
    }
    // --- END NEW ---
};

/**
 * --- NEW: Logout function ---
 * Clears the token and redirects to the login page.
 */
export const logoutUser = () => {
    console.log("logoutUser: Clearing token and redirecting to /login.");
    localStorage.removeItem(AUTH_TOKEN_KEY);
    window.location.href = '/login';
};
// --- END NEW ---


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
    return fetchApi('/camera_status', 'GET');
}

/**
 * Fetches event logs for today from the backend database.
 * @returns {Promise<object>} API response with today's logs.
 */
export const fetchTodayEventLogs = () => { // --- FIX: Removed the underscore ---
    return fetchApi('/event_logs/today', 'GET');
};