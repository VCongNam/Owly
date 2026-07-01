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

// Response Interceptor: Handle extraction & global errors
apiClient.interceptors.response.use(
  (response) => {
    // Return the data field directly if the API payload matches standards
    return response.data?.data ?? response.data;
  },
  (error) => {
    const response = error.response;

    if (response) {
      const status = response.status;
      const message = response.data?.message || 'Có lỗi xảy ra, vui lòng thử lại';

      if (status === 401) {
        // Clear token & redirect to signin
        localStorage.removeItem('owly_token');
        localStorage.removeItem('owly_user');
        sessionStorage.removeItem('owly_token');
        sessionStorage.removeItem('owly_user');
        
        // Use custom event or location change to avoid circular dependencies
        window.dispatchEvent(new Event('owly_unauthorized'));
        
        notifications.show({
          title: 'Hết phiên đăng nhập',
          message: 'Vui lòng đăng nhập lại để tiếp tục',
          color: 'red',
        });
      } else if (status >= 500) {
        notifications.show({
          title: 'Lỗi hệ thống',
          message: message || 'Máy chủ gặp sự cố. Vui lòng thử lại sau',
          color: 'red',
        });
      } else {
        // Validation/Client errors (e.g. 400 Bad Request)
        notifications.show({
          title: 'Yêu cầu không hợp lệ',
          message: message,
          color: 'red',
        });
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
