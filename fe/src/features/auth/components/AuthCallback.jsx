import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Loader, Text, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../../../services/apiClient';

/**
 * AuthCallback — Trang nhận `code` từ Google sau OAuth redirect.
 * URL: /auth/callback?code=xxxxx
 *
 * Luồng:
 *  1. Google redirect về đây với ?code=xxx
 *  2. Gửi code lên BE: POST /api/auth/google/exchange
 *  3. BE trả về { token, user }
 *  4. Lưu vào store → redirect về /
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const hasCalled = useRef(false); // Tránh gọi 2 lần do StrictMode

  useEffect(() => {
    if (hasCalled.current) return;
    hasCalled.current = true;

    const handleCallback = async () => {
      // 1. Kiểm tra hash (Supabase gửi link recovery dạng hash #access_token=...&type=recovery)
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.replace('#', '?'));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (accessToken && type === 'recovery') {
          try {
            // Thiết lập session tạm với token để gọi API lấy thông tin cá nhân
            setSession({ email: 'loading...' }, accessToken);
            
            // Gọi API lấy profile để cập nhật chính xác user info vào store
            const profileResponse = await apiClient.get('/api/auth/me');
            const user = profileResponse.data || profileResponse;
            
            setSession(user, accessToken);

            notifications.show({
              title: 'Xác thực khôi phục mật khẩu',
              message: 'Vui lòng thiết lập mật khẩu mới của bạn.',
              color: 'teal',
            });

            navigate('/change-password', { replace: true });
            return;
          } catch (err) {
            console.error('Recovery callback error:', err);
            notifications.show({
              title: 'Lỗi khôi phục mật khẩu',
              message: 'Không thể xác thực liên kết khôi phục. Vui lòng thử lại.',
              color: 'red',
            });
            navigate('/signin', { replace: true });
            return;
          }
        }
      }

      // 2. Kiểm tra search params (Google OAuth hoặc Supabase PKCE code flow)
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');
      const type = params.get('type');

      // Check if it is a recovery code (PKCE flow)
      if (type === 'recovery' && code) {
        // Handle code flow for recovery if needed, but standard Google OAuth/Supabase hash flow is most common.
      }

      // Google từ chối (user nhấn Cancel)
      if (error) {
        notifications.show({
          title: 'Đăng nhập bị hủy',
          message: 'Bạn đã hủy đăng nhập bằng Google.',
          color: 'orange',
        });
        navigate('/signin', { replace: true });
        return;
      }

      if (!code) {
        notifications.show({
          title: 'Lỗi xác thực',
          message: 'Không nhận được mã xác thực phù hợp.',
          color: 'red',
        });
        navigate('/signin', { replace: true });
        return;
      }

      try {
        // Gửi code lên BE để đổi lấy Supabase session
        const response = await apiClient.post('/api/auth/google/exchange', { code });
        const { user, token } = response.data || response;

        if (!token) {
          throw new Error('Không nhận được token từ server');
        }

        // Lưu session vào store (giống email/password login)
        setSession(user, token);

        notifications.show({
          title: 'Đăng nhập thành công',
          message: `Chào mừng, ${user?.user_metadata?.full_name || user?.email}!`,
          color: 'teal',
        });

        navigate('/', { replace: true });
      } catch (err) {
        console.error('Google OAuth callback error:', err);
        notifications.show({
          title: 'Đăng nhập Google thất bại',
          message: err.response?.data?.message || err.message || 'Vui lòng thử lại.',
          color: 'red',
        });
        navigate('/signin', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, setSession]);

  return (
    <Center style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <Stack align="center" gap="md">
        <Loader size="lg" color="copper" />
        <Text size="md" style={{ color: 'var(--text-color)', opacity: 0.7 }}>
          Đang xác thực với Google...
        </Text>
      </Stack>
    </Center>
  );
}

export default AuthCallback;
