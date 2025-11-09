/**
 * src/services/apiService.js
 * Centralized service for REST API calls to the Flask backend.
 */

// Base URL is intentionally relative because Vite proxies /api to http://localhost:5000
const BASE_API_URL = '/api';

/**
 * Handles all network requests, including error handling.
 * @param {string} endpoint - The API endpoint ('/login').
 * @param {string} method - The HTTP method ('GET').
 * @param {object} [data=null] - JSON data to send in the body.
 * @returns {Promise<object>} The JSON response data.
 */
const fetchApi = async (endpoint, method = 'GET', data = null) => {
    const url = `${BASE_API_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        if (response.status === 401) {
            throw new Error("Authentication failed or expired.");
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
export const loginUser = (username, password) => {
    return fetchApi('/login', 'POST', { username, password });
};

/**
 * Fetches historical sensor data for the ReportsPage.
 * @returns {Promise<object>} Time-series data.
 */
export const fetchReportsData = () => {
    // Mocking a successful data fetch for ReportsPage
    const mockData = {
        status: 'success',
        report: [
            { timestamp: 1715000000, temperature: 25.5, activity: 60 },
            { timestamp: 1715000060, temperature: 25.8, activity: 75 },
            { timestamp: 1715000120, temperature: 26.0, activity: 45 },
        ]
    };
    return Promise.resolve(mockData);
};


/**
 * Fetches the list of all active cameras from the backend.
 * @returns {Promise<object>} API response with camera list.
 */
export const fetchCameraList = () => {
    // This now calls your real backend endpoint from app.py
    return fetchApi('/camera_status', 'GET');
}