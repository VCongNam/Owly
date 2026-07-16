import axios from 'axios';
import { notifications } from '@mantine/notifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('owly_token') || sessionStorage.getItem('owly_token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cờ để tránh gọi refresh nhiều lần song song
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle extraction & global errors
apiClient.interceptors.response.use(
  (response) => {
    // Return the data field directly if the API payload matches standards
    return response.data?.data ?? response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const response = error.response;

    if (response) {
      const status = response.status;
      const message = response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';

      const isSignIn = originalRequest?.url?.includes('/api/auth/signin');
      const isLogout = originalRequest?.url?.includes('/api/auth/logout');
      const isRefresh = originalRequest?.url?.includes('/api/auth/refresh');

      if (status === 401 && !isSignIn && !isLogout && !isRefresh && !originalRequest._retry) {
        // ── Thử refresh token trước khi logout ──────────────────────────
        const refreshToken = localStorage.getItem('owly_refresh_token') || sessionStorage.getItem('owly_refresh_token');

        if (refreshToken) {
          if (isRefreshing) {
            // Đang refresh → xếp hàng request lại, chờ token mới
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return apiClient(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });

            const refreshJson = await refreshRes.json();

            if (!refreshRes.ok || !refreshJson.success || !refreshJson.data?.token) {
              throw new Error('Refresh failed');
            }

            const newToken = refreshJson.data.token;
            const newRefreshToken = refreshJson.data.refreshToken;

            // Ghi token mới vào đúng storage (giữ localStorage vs sessionStorage)
            const inLocal = !!localStorage.getItem('owly_token');
            const storage = inLocal ? localStorage : sessionStorage;

            storage.setItem('owly_token', newToken);
            if (newRefreshToken) storage.setItem('owly_refresh_token', newRefreshToken);

            // Gia hạn session expires_at
            const rememberMe = storage.getItem('owly_remember_me') === '1';
            const duration = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
            storage.setItem('owly_session_expires_at', String(Date.now() + duration));

            apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

            processQueue(null, newToken);
            isRefreshing = false;

            return apiClient(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;

            // Refresh thất bại → logout
            window.dispatchEvent(new CustomEvent('owly_session_expired'));
            return Promise.reject(refreshError);
          }
        } else {
          // Không có refresh_token → logout ngay
          window.dispatchEvent(new Event('owly_unauthorized'));
          notifications.show({
            title: 'Hết phiên đăng nhập',
            message: 'Vui lòng đăng nhập lại để tiếp tục',
            color: 'red',
          });
        }
      } else if (status === 401 && (isSignIn || isLogout)) {
        // Do not dispatch event or clear credentials for direct login/logout actions
      } else if (status >= 500) {
        notifications.show({
          title: 'Lỗi hệ thống',
          message: message || 'Máy chủ gặp sự cố. Vui lòng thử lại sau',
          color: 'red',
        });
      } else {
        // Validation/Client errors (e.g. 400 Bad Request, 403 Forbidden)
        if (!isSignIn && !isLogout) {
          notifications.show({
            title: 'Yêu cầu không hợp lệ',
            message: message,
            color: 'red',
          });
        }
      }
    } else {
      // Network issues
      notifications.show({
        title: 'Mất kết nối',
        message: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra lại mạng',
        color: 'red',
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
