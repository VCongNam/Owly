import { Paper, Title, Text, TextInput, PasswordInput, Button, Anchor, Checkbox } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import logo from '../../../assets/logo.png';
import classes from './AuthenticationImage.module.css';

export function SignIn() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email không đúng định dạng'),
      password: (value) => (value.length >= 6 ? null : 'Mật khẩu phải có ít nhất 6 ký tự'),
    },
  });

  const handleSubmit = async (values) => {
    console.log('Submitting login form', values);
    const result = await login(values.email, values.password, values.rememberMe);
    console.log('Login result', result);
    if (result.success) {
      notifications.show({
        title: 'Đăng nhập thành công',
        message: 'Chào mừng bạn quay trở lại với Owly',
        color: 'teal',
      });
      navigate('/');
    } else {
      notifications.show({
        title: 'Đăng nhập thất bại',
        message: result.error || 'Email hoặc mật khẩu không chính xác',
        color: 'red',
      });
    }
  };

  const handleOAuthLogin = (provider) => {
    const beUrl = import.meta.env.VITE_API_URL || '';

    if (provider === 'Google') {
      // Redirect đến BE — BE sẽ chuyển tiếp đến Google với redirect_uri = FE /auth/callback
      // Google sẽ hiển thị domain của FE (owly-demo.vercel.app) thay vì Supabase
      window.location.href = `${beUrl}/api/auth/google`;
      return;
    }

    // Facebook và các provider khác giữ nguyên dùng Supabase (chưa hỗ trợ)
    notifications.show({
      title: `${provider} chưa được hỗ trợ`,
      message: 'Tính năng này sẽ sớm được cập nhật.',
      color: 'orange',
    });
  };

  return (
    <div className={classes.wrapper}>
      {/* Cột trái: Ảnh minh họa / Nền gradient thương hiệu */}
      <div className={classes.leftSide}>
        <div style={{ textAlign: 'center', color: '#fff', zIndex: 10 }}>
          <img
            src={logo}
            alt="Owly Logo Large"
            style={{
              width: '120px',
              height: '120px',
              objectFit: 'contain',
              marginBottom: '1.5rem',
              filter: 'brightness(0) invert(1)', // Chuyển logo sang màu trắng trên nền tối
            }}
          />
          <Title order={1} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.5rem', marginBottom: '1rem' }}>
            Owly
          </Title>
          <Text size="lg" style={{ opacity: 0.9, maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
            Hệ thống quản lý thông minh giúp giáo viên kết nối và vận hành lớp học một cách tinh tế nhất.
          </Text>
        </div>
        {/* Lớp nền thiết kế trừu tượng */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-20%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Cột phải: Form nhập liệu */}
      <div className={classes.rightSide}>
        <Paper className={classes.form} withBorder={false}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Title order={2} className={classes.title}>
              Chào mừng quay lại
            </Title>
            <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.6, marginTop: '0.25rem' }}>
              Nhập thông tin tài khoản của bạn để tiếp tục
            </Text>
          </div>

          {/* Social Logins */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
            <Button
              variant="outline"
              color="gray"
              fullWidth
              onClick={() => handleOAuthLogin('Google')}
              style={{ borderColor: 'var(--border-color)' }}
              leftSection={
                <img
                  src="https://cdn.simpleicons.org/google/000000"
                  alt="Google"
                  style={{ width: '16px', height: '16px' }}
                />
              }
            >
              Google
            </Button>
            <Button
              variant="outline"
              color="gray"
              fullWidth
              onClick={() => handleOAuthLogin('Facebook')}
              style={{ borderColor: 'var(--border-color)' }}
              leftSection={
                <img
                  src="https://cdn.simpleicons.org/facebook/1877F2"
                  alt="Facebook"
                  style={{ width: '16px', height: '16px' }}
                />
              }
            >
              Facebook
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', justifyContent: 'center' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <Text size="xs" style={{ padding: '0 10px', color: 'var(--text-color)', opacity: 0.5 }}>HOẶC ĐĂNG NHẬP BẰNG EMAIL</Text>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              required
              label="Địa chỉ email"
              placeholder="Nhập email của bạn"
              size="md"
              radius="md"
              {...form.getInputProps('email')}
              styles={{
                label: {
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                },
              }}
            />
            <PasswordInput
              required
              label="Mật khẩu"
              placeholder="Mật khẩu của bạn"
              mt="md"
              size="md"
              radius="md"
              {...form.getInputProps('password')}
              styles={{
                label: {
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                },
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
              <Checkbox 
                label="Duy trì đăng nhập trên thiết bị này" 
                size="sm" 
                {...form.getInputProps('rememberMe', { type: 'checkbox' })} 
              />
              <Anchor component={Link} to="/forgot-password" size="sm" fw={500} color="copper">
                Quên mật khẩu?
              </Anchor>
            </div>
            <Button 
              fullWidth 
              mt="xl" 
              size="md" 
              radius="md" 
              type="submit" 
              loading={loading} 
              color="copper"
              className={classes.button}
            >
              Đăng nhập
            </Button>
          </form>
          <Text ta="center" mt="lg" size="sm" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
            Chưa có tài khoản?{' '}
            <Anchor component={Link} to="/signup" fw={600} color="copper">
              Đăng ký ngay
            </Anchor>
          </Text>
        </Paper>
      </div>
    </div>
  );
}

export default SignIn;
