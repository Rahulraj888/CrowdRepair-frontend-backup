import axios from 'axios';

// Create an axios instance with a base URL pointing to your backend
const api = axios.create({
  baseURL: import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api/auth',
});

// Attach JWT to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // Or if your backend expects x-auth-token:
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
