import { useState, useEffect } from 'react';
import { Paper, Title, Text, TextInput, PasswordInput, Button, MultiSelect, Anchor, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import { notifications } from '@mantine/notifications';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/logo.png';
import classes from '../components/AuthenticationImage.module.css';

export function SignUp() {
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  
  // Captcha ngẫu nhiên
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const generateCaptcha = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaCode(code);
    setCaptchaInput('');
    setCaptchaError('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Load available subjects for teacher specialization
  useEffect(() => {
    async function fetchSubjects() {
      setLoadingSubjects(true);
      try {
        const data = await apiClient.get('/api/subjects');
        const formatted = (data || []).map((sub) => ({
          value: sub.id,
          label: `${sub.name} (${sub.code})`,
        }));
        setSubjects(formatted);
      } catch {
        notifications.show({
          title: 'Lỗi tải môn học',
          message: 'Không thể tải danh sách môn học chuyên môn',
          color: 'red',
        });
      } finally {
        setLoadingSubjects(false);
      }
    }
    fetchSubjects();
  }, []);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      fullName: '',
      specializationIds: [],
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email không đúng định dạng'),
      password: (value) => (value.length >= 6 ? null : 'Mật khẩu phải có ít nhất 6 ký tự'),
      confirmPassword: (value, values) => (value === values.password ? null : 'Mật khẩu xác nhận không khớp'),
      phone: (value) => (/^(0[3|5|7|8|9])+([0-9]{8})$/.test(value) ? null : 'Số điện thoại không đúng định dạng'),
      fullName: (value) => (value.trim() ? null : 'Họ và tên là bắt buộc'),
    },
  });

  const handleSubmit = async (values) => {
    if (captchaInput !== captchaCode) {
      setCaptchaError('Mã kiểm tra không chính xác');
      return;
    }
    setSubmitError(null);
    const result = await signUp({
      email: values.email,
      password: values.password,
      phone: values.phone,
      fullName: values.fullName,
      specializationIds: values.specializationIds,
    });
    if (result.success) {
      notifications.show({
        title: 'Đăng ký thành công',
        message: 'Vui lòng kiểm tra email để xác thực tài khoản',
        color: 'teal',
      });
      setRegisteredEmail(values.email);
    } else {
      setSubmitError(result.error);
      generateCaptcha(); // Reset captcha khi lỗi
    }
  };

  const handleOAuthLogin = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider.toLowerCase(), // 'google' hoặc 'facebook'
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err) {
      notifications.show({
        title: `Lỗi kết nối OAuth ${provider}`,
        message: err.message || 'Không thể thiết lập kết nối OAuth. Vui lòng thử lại.',
        color: 'red',
      });
    }
  };

  if (registeredEmail) {
    return (
      <div className={classes.wrapper}>
        <Paper className={classes.form} radius="md" p="xl">
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(200, 122, 138, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'var(--accent-color)',
                margin: '0 auto 1.5rem',
              }}
            >
              ✉
            </div>
            <Title order={2} className={classes.title}>
              Xác thực tài khoản của bạn
            </Title>
            <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.8, marginTop: '1rem', lineHeight: '1.6' }}>
              Chúng tôi đã gửi một email kích hoạt tài khoản đến địa chỉ{' '}
              <strong>{registeredEmail}</strong>. Vui lòng kiểm tra hộp thư của bạn và nhấn vào liên kết xác thực trước khi tiến hành đăng nhập.
            </Text>
            <Button
              color="copper"
              fullWidth
              onClick={() => navigate('/signin')}
              style={{ marginTop: '2rem' }}
              size="md"
              radius="md"
              className={classes.button}
            >
              Đi tới đăng nhập
            </Button>
          </div>
        </Paper>
      </div>
    );
  }

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
              filter: 'brightness(0) invert(1)',
            }}
          />
          <Title order={1} style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.5rem', marginBottom: '1rem' }}>
            Owly
          </Title>
          <Text size="lg" style={{ opacity: 0.9, maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
            Khởi tạo hệ thống và số hóa hoạt động giảng dạy của bạn một cách trực quan, tối ưu và chuyên nghiệp.
          </Text>
        </div>
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

      {/* Cột phải: Form Đăng ký một màn hình */}
      <div className={classes.rightSide}>
        <Paper className={classes.form} withBorder={false}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <Title order={2} className={classes.title}>
              Đăng ký Giáo viên
            </Title>
            <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.6, marginTop: '0.25rem' }}>
              Điền thông tin để khởi tạo tài khoản lớp học của bạn
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
            <Text size="xs" style={{ padding: '0 10px', color: 'var(--text-color)', opacity: 0.5 }}>HOẶC ĐĂNG KÝ BẰNG EMAIL</Text>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              required
              label="Họ và tên"
              placeholder="Nguyễn Văn Nam"
              {...form.getInputProps('fullName')}
              size="md"
              radius="md"
              styles={{
                label: { marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' },
              }}
            />

            <TextInput
              required
              label="Địa chỉ email"
              placeholder="email@example.com"
              {...form.getInputProps('email')}
              size="md"
              radius="md"
              mt="md"
              styles={{
                label: { marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' },
              }}
            />

            <PasswordInput
              required
              label="Mật khẩu"
              placeholder="Mật khẩu tối thiểu 6 ký tự"
              {...form.getInputProps('password')}
              size="md"
              radius="md"
              mt="md"
              styles={{
                label: { marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' },
              }}
            />

            <PasswordInput
              required
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu của bạn"
              {...form.getInputProps('confirmPassword')}
              size="md"
              radius="md"
              mt="md"
              styles={{
                label: { marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' },
              }}
            />

            <TextInput
              required
              label="Số điện thoại"
              placeholder="0987654321"
              {...form.getInputProps('phone')}
              size="md"
              radius="md"
              mt="md"
              styles={{
                label: { marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' },
              }}
            />

            <MultiSelect
              label="Môn học chuyên môn"
              placeholder={loadingSubjects ? 'Đang tải môn học...' : 'Chọn môn học giảng dạy'}
              data={subjects}
              disabled={loadingSubjects}
              {...form.getInputProps('specializationIds')}
              size="md"
              radius="md"
              mt="md"
              styles={{
                label: { marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' },
              }}
            />

            {/* Captcha Box */}
            <Box mt="md">
              <Text size="sm" fw={500} style={{ color: 'var(--text-color)', marginBottom: '6px' }}>Mã kiểm tra (Captcha)</Text>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{
                  background: 'var(--border-color)',
                  color: 'var(--accent-color)',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  letterSpacing: '3px',
                  userSelect: 'none',
                  fontStyle: 'italic',
                  textDecoration: 'line-through'
                }}>
                  {captchaCode}
                </div>
                <Button variant="subtle" size="xs" onClick={generateCaptcha}>Làm mới</Button>
              </div>
              <TextInput
                placeholder="Nhập mã kiểm tra ở trên"
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value);
                  setCaptchaError('');
                }}
                error={captchaError}
                mt="xs"
                size="md"
                radius="md"
              />
            </Box>

            {submitError && (
              <Text color="red" size="sm" mt="md" style={{ textAlign: 'center' }}>
                {submitError}
              </Text>
            )}

            <Button
              type="submit"
              color="copper"
              loading={loading}
              size="md"
              radius="md"
              fullWidth
              mt="xl"
              className={classes.button}
            >
              Đăng ký hoàn tất
            </Button>
          </form>

          <Text ta="center" mt="lg" size="sm" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
            Đã có tài khoản?{' '}
            <Anchor component={Link} to="/signin" fw={600} color="copper">
              Đăng nhập
            </Anchor>
          </Text>
        </Paper>
      </div>
    </div>
  );
}

export default SignUp;
