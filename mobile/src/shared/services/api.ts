import axios from 'axios';
import { useAuthStore } from '../store/authStore';

import { Platform } from 'react-native';

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // IP mạng LAN của máy tính bạn (từ log: 192.168.1.198)
  // Dùng IP này để điện thoại thật cắm cùng mạng có thể kết nối được tới Backend
  const DEV_PC_IP = '192.168.1.198';

  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  if (Platform.OS === 'android') {
    // 10.0.2.2 là IP loopback trỏ về localhost máy tính dành riêng cho giả lập Android
    return 'http://10.0.2.2:5000/api';
  }

  // Chạy trên iOS Simulator hoặc Thiết bị thật (cần dùng IP LAN)
  return `http://${DEV_PC_IP}:5000/api`;
};

const API_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
