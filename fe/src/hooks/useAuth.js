import { create } from 'zustand';
import { apiClient } from '../services/apiClient';

const getInitialUser = () => {
  try {
    const userStr = localStorage.getItem('owly_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  token: localStorage.getItem('owly_token') || null,
  loading: false,
  error: null,

  setSession: (user, token) => {
    if (token) {
      localStorage.setItem('owly_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('owly_token');
      delete apiClient.defaults.headers.common['Authorization'];
    }

    if (user) {
      localStorage.setItem('owly_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('owly_user');
    }

    set({ user, token });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      // API call to backend login
      const response = await apiClient.post('/api/auth/signin', { email, password });
      
      // Assume API returns { token, user } or similar structure
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

  logout: () => {
    localStorage.removeItem('owly_token');
    localStorage.removeItem('owly_user');
    set({ user: null, token: null, error: null });
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
