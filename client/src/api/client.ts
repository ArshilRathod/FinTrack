import axios from 'axios';

const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '/api' : `${protocol}//${host}:5001/api`);

const api = axios.create({
  baseURL: apiBaseUrl
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fintrack-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('fintrack-token');
      localStorage.removeItem('fintrack-user');
      window.location.replace('/login');
    }

    const responseData = error.response?.data;
    const responseMessage =
      typeof responseData === 'string'
        ? responseData
        : typeof responseData?.message === 'string'
          ? responseData.message
          : null;

    const message =
      responseMessage ||
      (error.code === 'ERR_NETWORK'
        ? 'Backend not reachable. Start the server on port 5001.'
        : error.response?.status === 404
          ? 'API route not found. Restart the server and try again.'
          : error.response?.status === 500
            ? 'Server error. Check the backend and try again.'
            : 'Request failed');

    return Promise.reject(new Error(message));
  }
);

export default api;
