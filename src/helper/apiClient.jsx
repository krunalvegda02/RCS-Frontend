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
        // Automatically add token from localStorage if available
        const token = localStorage.getItem('token');
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }

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
let isHandlingAuth = false;

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('/login');

        // Check for deactivated account in any error response
        const errorMessage = error.response?.data?.message || '';
        const isDeactivated = errorMessage.toLowerCase().includes('deactivated');

        if (isDeactivated && !isAuthPage && !isHandlingAuth) {
            isHandlingAuth = true;
            console.log('Deactivated account detected, clearing auth and redirecting...');

            // Clear auth data
            localStorage.clear();

            // Dispatch logout to Redux store
            if (window.__REDUX_STORE__) {
                window.__REDUX_STORE__.dispatch({ type: 'auth/logout' });
            }

            // Force redirect
            setTimeout(() => {
                isHandlingAuth = false;
                window.location.href = '/login?reason=deactivated';
            }, 100);

            return Promise.reject(error);
        }

        const originalRequest = error.config;

        // Handle 401 errors (Unauthorized)
        if (error.response?.status === 401 && !originalRequest._isRetry) {
            originalRequest._isRetry = true;

            // Don't redirect if it's a password-related error (wrong current password/2FA)
            const isCredentialError = originalRequest.url?.includes('update-password') ||
                originalRequest.url?.includes('change-password') ||
                originalRequest.url?.includes('2fa/disable') ||
                originalRequest.url?.includes('2fa/verify') ||
                originalRequest.url?.includes('login/2fa') ||
                originalRequest.url?.includes('admin/users/');

            // Don't redirect if already on auth page or already handling auth or credential error
            if (!isAuthPage && !isHandlingAuth && !isCredentialError) {
                isHandlingAuth = true;

                // Determine redirect reason
                let reason = 'unauthorized';

                if (errorMessage.toLowerCase().includes('expired')) {
                    reason = 'session_expired';
                } else if (errorMessage.toLowerCase().includes('invalid')) {
                    reason = 'token_invalid';
                }

                // Clear auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Dispatch logout to Redux store
                if (window.__REDUX_STORE__) {
                    window.__REDUX_STORE__.dispatch({ type: 'auth/logout' });
                }

                // Reset flag after a delay
                setTimeout(() => {
                    isHandlingAuth = false;
                }, 1000);

                // Redirect to login with reason
                window.location.replace(`/login?reason=${reason}`);
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
    const configWithParams = { ...config, params: data };
    return apiClient.get(fullUrl, addTokenToConfig(configWithParams, token));
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

    // Invoice
    downloadInvoice: async (orderId) => {
        const response = await apiClient.get(`v1/payment/invoice/${orderId}`, {
            responseType: 'blob', // Important for file download
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`
            }
        });
        return response;
    },

    addWalletRequest: (data) => _post('wallet/request', data),
    updateProfile: (data) => _put('auth/profile', data),
    changePassword: (data) => _post('auth/change-password', data),

    // Wallet request methods
    getWalletRequests: () => _get('wallet/admin/requests'),
    approveWalletRequest: (requestId, adminNote) => _put(`wallet/admin/approve/${requestId}`, { adminNote }),
    rejectWalletRequest: (requestId, rejectionReason) => _put(`wallet/admin/reject/${requestId}`, { rejectionReason }),
    deleteWalletRequest: (requestId) => _delete(`wallet/admin/delete/${requestId}`),

    // 2FA Methods
    setup2FA: () => _post('auth/2fa/setup'),
    verify2FA: (token) => _post('auth/2fa/verify', { token }),
    disable2FA: (password) => _post('auth/2fa/disable', { password }),
    verifyLogin2FA: (userId, token) => _post('auth/login/2fa', { userId, token }),

    // Admin Impersonation
    impersonateUser: (userId) => _post(`auth/admin/impersonate/${userId}`),

    // Delete User
    deleteUser: (userId, adminPassword) => _delete(`auth/admin/users/${userId}`, { adminPassword }, { data: { adminPassword } })
};

export { _delete, _get, _post, _patch, _put };
export default apiService;