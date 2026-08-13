import { create } from 'zustand';
import { apiClient } from '../../../services/apiClient';
import { notifications } from '@mantine/notifications';

// ── Hằng số thời gian session ──────────────────────────────────────────────
const SESSION_DURATION_DEFAULT = 24 * 60 * 60 * 1000;      // 1 ngày (không "duy trì")
const SESSION_DURATION_REMEMBER = 30 * 24 * 60 * 60 * 1000; // 30 ngày (có "duy trì")

// ── Helpers để đọc dữ liệu từ storage ─────────────────────────────────────
const getFromStorage = (key) => {
  try {
    const val = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!val || val === 'undefined' || val === 'null') return null;
    return val;
  } catch {
    return null;
  }
};

const getInitialUser = () => {
  try {
    const userStr = localStorage.getItem('owly_user') || sessionStorage.getItem('owly_user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

const getInitialToken = () => {
  const token = getFromStorage('owly_token');
  return token;
};

/**
 * Kiểm tra xem session hiện tại có còn hợp lệ không dựa vào owly_session_expires_at.
 * Nếu đã quá hạn → trả về false, yêu cầu đăng nhập lại.
 */
const isSessionExpired = () => {
  const expiresAt = getFromStorage('owly_session_expires_at');
  if (!expiresAt) return false; // Không có giới hạn → còn hợp lệ (backward-compat)
  return Date.now() > parseInt(expiresAt, 10);
};

/**
 * Xác định storage phù hợp (localStorage nếu "duy trì", sessionStorage nếu không).
 */
const resolveStorage = () => {
  const inLocal = !!localStorage.getItem('owly_token');
  return inLocal ? localStorage : sessionStorage;
};

// ── Hàm ghi/xóa session vào storage ──────────────────────────────────────
const saveSession = (user, token, refreshToken, expiresAt, rememberMe) => {
  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem('owly_token', token);
  storage.setItem('owly_user', JSON.stringify(user));
  if (refreshToken) storage.setItem('owly_refresh_token', refreshToken);

  // Ghi thời điểm hết hạn session (giới hạn FE tự quản lý thêm)
  const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
  storage.setItem('owly_session_expires_at', String(Date.now() + duration));
  // Ghi flag để biết "duy trì" hay không
  storage.setItem('owly_remember_me', rememberMe ? '1' : '0');
};

const clearSession = () => {
  ['owly_token', 'owly_user', 'owly_refresh_token', 'owly_session_expires_at', 'owly_remember_me'].forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  delete apiClient.defaults.headers.common['Authorization'];
};

// ── Kiểm tra khi khởi động app: session đã hết hạn? ──────────────────────
if (isSessionExpired()) {
  clearSession();
}

export const useAuthStore = create((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  loading: false,
  error: null,

  /**
   * Cập nhật token mới sau khi refresh (ghi đè lên đúng storage cũ).
   */
  setSession: (user, token) => {
    const storage = resolveStorage();

    if (token) {
      storage.setItem('owly_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      clearSession();
    }

    if (user) {
      storage.setItem('owly_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('owly_user');
      sessionStorage.removeItem('owly_user');
    }

    set({ user, token });
  },

  /**
   * Làm mới access_token bằng refresh_token.
   * Trả về true nếu thành công, false nếu thất bại (cần login lại).
   */
  refreshAccessToken: async () => {
    const refreshToken = getFromStorage('owly_refresh_token');
    if (!refreshToken) return false;

    try {
      // Gọi trực tiếp bằng fetch để tránh vòng lặp interceptor
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) return false;

      const json = await response.json();
      if (!json.success || !json.data?.token) return false;

      const { token, refreshToken: newRefreshToken } = json.data;
      const storage = resolveStorage();

      storage.setItem('owly_token', token);
      if (newRefreshToken) storage.setItem('owly_refresh_token', newRefreshToken);

      // Gia hạn thêm thời gian session (giữ nguyên loại duration)
      const rememberMe = storage.getItem('owly_remember_me') === '1';
      const duration = rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
      storage.setItem('owly_session_expires_at', String(Date.now() + duration));

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token });
      return true;
    } catch {
      return false;
    }
  },

  login: async (email, password, rememberMe = false, role = 'teacher') => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.post('/api/auth/signin', { email, password, role });

      const { user, token, refreshToken, expiresAt } = response;

      if (!token) {
        throw new Error('Token không tồn tại trong phản hồi đăng nhập');
      }

      saveSession(user, token, refreshToken, expiresAt, rememberMe);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

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
      const response = await apiClient.post('/api/auth/signup', payload);

      const { user, token, refreshToken, expiresAt } = response;
      if (token) {
        // Đăng ký mặc định duy trì đăng nhập 30 ngày
        saveSession(user, token, refreshToken, expiresAt, true);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
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
      const storage = resolveStorage();
      storage.setItem('owly_user', JSON.stringify(updatedUser));

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
      clearSession();
      set({ user: null, token: null, error: null });
    }
  },
}));

// ── Tự động xử lý 401: thử refresh trước khi logout ──────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('owly_unauthorized', async () => {
    const store = useAuthStore.getState();
    const refreshed = await store.refreshAccessToken();
    if (!refreshed) {
      store.logout();
    }
  });

  // Khi apiClient interceptor đã thử refresh nhưng vẫn thất bại
  window.addEventListener('owly_session_expired', () => {
    useAuthStore.getState().logout();
    notifications.show({
      title: 'Phiên đăng nhập hết hạn',
      message: 'Vui lòng đăng nhập lại để tiếp tục',
      color: 'orange',
    });
  });

  // ── Proactive auto-refresh cho "Duy trì đăng nhập" ───────────────────────
  // Refresh token mỗi 23 giờ (trước khi JWT 24h hết hạn) để user không bao giờ bị logout
  const PROACTIVE_REFRESH_INTERVAL = 23 * 60 * 60 * 1000; // 23 giờ

  let proactiveRefreshTimer = null;

  const startProactiveRefresh = () => {
    stopProactiveRefresh();
    proactiveRefreshTimer = setInterval(async () => {
      const { token, refreshAccessToken } = useAuthStore.getState();
      const rememberMe = localStorage.getItem('owly_remember_me') === '1';
      if (token && rememberMe) {
        console.log('[Owly] Proactive token refresh (duy trì đăng nhập)...');
        await refreshAccessToken();
      }
    }, PROACTIVE_REFRESH_INTERVAL);
  };

  const stopProactiveRefresh = () => {
    if (proactiveRefreshTimer) {
      clearInterval(proactiveRefreshTimer);
      proactiveRefreshTimer = null;
    }
  };

  // Khởi động proactive refresh nếu đang "duy trì đăng nhập" và có token
  const initToken = getFromStorage('owly_token');
  const initRemember = localStorage.getItem('owly_remember_me') === '1';
  if (initToken && initRemember) {
    // Refresh ngay khi mở lại trang (token có thể sắp hết hạn)
    setTimeout(async () => {
      const store = useAuthStore.getState();
      if (store.token) {
        console.log('[Owly] Refreshing token on page load (duy trì đăng nhập)...');
        await store.refreshAccessToken();
      }
    }, 3000); // Chờ 3s sau khi app load xong

    startProactiveRefresh();
  }

  // Theo dõi thay đổi trạng thái đăng nhập để bật/tắt proactive refresh
  useAuthStore.subscribe((state, prevState) => {
    if (state.token && !prevState.token) {
      // Vừa đăng nhập
      const rememberMe = localStorage.getItem('owly_remember_me') === '1';
      if (rememberMe) startProactiveRefresh();
    } else if (!state.token && prevState.token) {
      // Vừa đăng xuất
      stopProactiveRefresh();
    }
  });
}

export function useAuth() {
  const store = useAuthStore();
  return store;
}
