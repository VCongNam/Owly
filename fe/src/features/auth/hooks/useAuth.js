import { create } from 'zustand';
import { apiClient } from '../../../services/apiClient';

const getInitialUser = () => {
  try {
    const userStr = localStorage.getItem('owly_user') || sessionStorage.getItem('owly_user');
    return userStr && userStr !== 'undefined' ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const getInitialToken = () => {
  const token = localStorage.getItem('owly_token') || sessionStorage.getItem('owly_token');
  if (token === 'undefined' || token === 'null') {
    localStorage.removeItem('owly_token');
    sessionStorage.removeItem('owly_token');
    return null;
  }
  return token || null;
};

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  loading: false,
  error: null,

  setSession: (user, token) => {
    // Save to wherever it was previously saved, or fallback to localStorage
    const useSession = !!sessionStorage.getItem('owly_token');
    const storage = useSession ? sessionStorage : localStorage;
    
    if (token) {
      storage.setItem('owly_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('owly_token');
      sessionStorage.removeItem('owly_token');
      delete apiClient.defaults.headers.common['Authorization'];
    }

    if (user) {
      storage.setItem('owly_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('owly_user');
      sessionStorage.removeItem('owly_user');
    }

    set({ user, token });
  },

  login: async (email, password, rememberMe = false) => {
    set({ loading: true, error: null });
    try {
      // API call to backend login
      const response = await apiClient.post('/api/auth/signin', { email, password });
      
      // Assume API returns { token, user } or similar structure
      const { user, token } = response;
      
      const storage = rememberMe ? localStorage : sessionStorage;

      if (token) {
        storage.setItem('owly_token', token);
      } else {
        console.error('Token is missing in login response!');
      }

      if (user) {
        storage.setItem('owly_user', JSON.stringify(user));
      }
      
      set({ user, token, loading: false });
      return { success: true, user };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Đăng nhập không thành công';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  signUp: async (payload) => {
    set({ loading: true, error: null });
    try {
      // payload matches { email, password, fullName, phone, specializationIds }
      const response = await apiClient.post('/api/auth/signup', payload);
      
      const { user, token } = response;
      if (token) {
        localStorage.setItem('owly_token', token);
      }
      if (user) {
        localStorage.setItem('owly_user', JSON.stringify(user));
      }

      set({ user, token, loading: false });
      return { success: true, user };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Đăng ký tài khoản thất bại';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  registerProfile: async (fullName, specializationIds) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/api/auth/register-profile', {
        fullName,
        specializationIds,
      });

      const updatedUser = response.user || response;
      localStorage.setItem('owly_user', JSON.stringify(updatedUser));
      
      set({ user: updatedUser, loading: false });
      return { success: true, user: updatedUser };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Đăng ký hồ sơ thất bại';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  changePassword: async (newPassword, confirmNewPassword) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/api/auth/change-password', { newPassword, confirmNewPassword });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Đổi mật khẩu thất bại';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await apiClient.post('/api/auth/forgot-password', { email });
      set({ loading: false });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Yêu cầu đặt lại mật khẩu thất bại';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch (err) {
      console.warn('Logout request failed', err);
    } finally {
      localStorage.removeItem('owly_token');
      localStorage.removeItem('owly_user');
      sessionStorage.removeItem('owly_token');
      sessionStorage.removeItem('owly_user');
      delete apiClient.defaults.headers.common['Authorization'];
      set({ user: null, token: null, error: null });
    }
  },
}));

// Listen to global 401 events from apiClient
if (typeof window !== 'undefined') {
  window.addEventListener('owly_unauthorized', () => {
    useAuthStore.getState().logout();
  });
}

export function useAuth() {
  const store = useAuthStore();
  return store;
}
