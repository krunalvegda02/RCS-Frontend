import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to handle FormData uploads and add auth token
apiClient.interceptors.request.use(
    (config) => {
        // Token will be injected by Redux middleware or manually
        // For now, we'll handle it in individual requests
        
        // If data is FormData, remove Content-Type header to let axios set it automatically with boundary
        if (config.data instanceof FormData) {
            // Delete Content-Type from headers to allow axios to set it with proper boundary
            if (config.headers) {
                delete config.headers['Content-Type'];
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const currentPath = window.location.pathname;
                const errorMessage = error.response?.data?.message || '';
            
            // Only redirect if it's actually a token/auth issue, not a validation error
            const isAuthError = errorMessage.toLowerCase().includes('token') || 
                               errorMessage.toLowerCase().includes('expired') || 
                               errorMessage.toLowerCase().includes('unauthorized') ||
                               errorMessage.toLowerCase().includes('authentication');
            
            // Only redirect if not already on auth pages and if it's a real auth error
            if (isAuthError &&
                !currentPath.includes('/login') && 
                !currentPath.includes('/register') && 
                !currentPath.includes('/join') && 
                !currentPath.includes('/reset-password')) {
                // Clear any stored auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Helper function to add token to config
const addTokenToConfig = (config, token) => {
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
};

// eslint-disable-next-line no-unused-vars
const _get = (url, data = {}, config = {}, token = null) => {
    const fullUrl = url.startsWith('realtime/') ? url : url.startsWith('v1/') || url.startsWith('wallet/') ? url : `v1/${url}`;
    return apiClient.get(fullUrl, addTokenToConfig(config, token));
};

// eslint-disable-next-line no-unused-vars
const _delete = (url, data = {}, config = {}, token = null) => {
    const fullUrl = url.startsWith('realtime/') ? url : url.startsWith('v1/') || url.startsWith('wallet/') ? url : `v1/${url}`;
    return apiClient.delete(fullUrl, addTokenToConfig(config, token));
};

const _patch = (url, data = {}, config = {}, token = null) => {
    const fullUrl = url.startsWith('realtime/') ? url : url.startsWith('v1/') || url.startsWith('wallet/') ? url : `v1/${url}`;
    return apiClient.patch(fullUrl, data, addTokenToConfig(config, token));
};

const _post = (url, data = {}, config = {}, token = null) => {
    const fullUrl = url.startsWith('realtime/') ? url : url.startsWith('v1/') || url.startsWith('wallet/') ? url : `v1/${url}`;
    return apiClient.post(fullUrl, data, addTokenToConfig(config, token));
};

const _put = (url, data = {}, config = {}, token = null) => {
    const fullUrl = url.startsWith('realtime/') ? url : url.startsWith('v1/') || url.startsWith('wallet/') ? url : `v1/${url}`;
    return apiClient.put(fullUrl, data, addTokenToConfig(config, token));
};

// Create API service object with all methods
const apiService = {
    get: _get,
    post: _post,
    put: _put,
    patch: _patch,
    delete: _delete,
    // Add any other methods that might be used
    getmonthlyliyanalytics: (userId) => _get(`analytics/monthly/${userId}`),
    getweekliyanalytics: (userId) => _get(`analytics/weekly/${userId}`),
    adminsummry: () => _get('admin/summary'),
    getUserMessages: (userId) => _get(`messages/user/${userId}`),
    getProfileWithTransactions: (userId, limit) => _get(`profile/${userId}/transactions?limit=${limit}`),
    addWalletRequest: (data) => _post('wallet/request', data),
    updateProfile: (userId, data) => _put(`profile/${userId}`, data),
    changePassword: (data) => _post('auth/change-password', data)
};

export { _delete, _get, _post, _patch, _put };
export default apiService;