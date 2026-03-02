import axios from 'axios';

const api = axios.create({
    // Use VITE_API_URL for production (e.g. Vercel), fallback to '/api' for local dev (Vite proxy)
    baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Send HttpOnly cookies automatically
});

// Response interceptor to handle 401s
// No request interceptor needed — the hf_access cookie is sent automatically
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/auth/login');
        if (error.response?.status === 401 && !isLoginRequest) {
            // Cookie-based auth: if server returns 401, the cookie is missing/expired.
            // Redirect to login unconditionally, UNLESS it's the login form itself failing.
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
