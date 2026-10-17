import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bhumisetu_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Sliding Session Token Rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, attempt refresh token rotation
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh') && !originalRequest.url.includes('/auth/login')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('bhumisetu_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
          if (res.data?.success && res.data.accessToken) {
            localStorage.setItem('bhumisetu_access_token', res.data.accessToken);
            if (res.data.refreshToken) {
              localStorage.setItem('bhumisetu_refresh_token', res.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          // Token refresh failed, clear credentials
          localStorage.removeItem('bhumisetu_access_token');
          localStorage.removeItem('bhumisetu_refresh_token');
          localStorage.removeItem('bhumisetu_user');
          window.dispatchEvent(new CustomEvent('bhumisetu:unauthorized'));
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
