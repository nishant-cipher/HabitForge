import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy forwards this to localhost:3000
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle 401s
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only force logout if the user has no token stored at all.
            // If a token exists but the API returns 401, it may be a backend
            // misconfiguration — don't log out the user mid-session.
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
