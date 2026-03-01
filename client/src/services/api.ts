import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxy forwards this to localhost:3000
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
        if (error.response?.status === 401) {
            // Cookie-based auth: if server returns 401, the cookie is missing/expired.
            // Redirect to login unconditionally.
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
