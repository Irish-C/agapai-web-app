// src/services/apiService.js

// Base URL is intentionally relative because Vite proxies /api to http://localhost:5000
const BASE_API_URL = '/api';
const AUTH_TOKEN_KEY = 'authToken'; 

// Export the user fetching function
export const fetchUsers = () => {
    return fetchApi('/users', 'GET'); 
};

// --- REST OF THE FILE (Existing Functions) ---

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

        if (response.status === 401) {
            if (!endpoint.includes('/login')) {
                console.error('fetchApi: 401 Unauthorized. Redirecting to login.');
                logoutUser(); 
                window.location.href = '/login'; 
            }
            throw new Error("Authentication failed or expired.");
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.message || errorData.msg || `HTTP error! status: ${response.status} for ${url}`;
            console.error('API Error Response:', errorData);
            throw new Error(message);
        }

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


export const loginUser = async (username, password) => {
    try {
        const response = await fetchApi('/login', 'POST', { username, password });

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

export const logoutUser = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    console.log("logoutUser: Token removed.");
};

export const fetchCameraList = () => {
    return fetchApi('/camera_status', 'GET');
}

export const fetchDailySummary = () => {
    return fetchApi('/summary/daily', 'GET');
};

/**
 * Fetches historical event log data for the ReportsPage.
 * This function must exist in apiService.js.
 * @returns {Promise<object>} Time-series data.
 */
// Make sure the 'export' keyword is present here
export const fetchReportsData = () => {
    // Assuming your backend route for reports is '/event_logs'
    return fetchApi('/event_logs', 'GET');
};

/**
 * Fetches the detailed profile for the currently logged-in user.
 * Assumes backend uses JWT identity to find the user.
 */
export const fetchUserProfile = () => {
    return fetchApi('/user/profile', 'GET');
};

/**
 * Sends a request to change the password.
 */
export const changePassword = (oldPassword, newPassword) => {
    return fetchApi('/users/change-password', 'POST', { 
        old_password: oldPassword, 
        new_password: newPassword 
    });
};