import { useState, useEffect } from 'react';
import { Paper, Title, Text, TextInput, PasswordInput, Button, Stepper, MultiSelect, Anchor, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import { notifications } from '@mantine/notifications';
import logo from '../assets/logo.png';
import classes from '../components/AuthenticationImage.module.css';

export function SignUp() {
  const { signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [registeredEmail, setRegisteredEmail] = useState(null);

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
      phone: '',
      fullName: '',
      specializationIds: [],
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email không đúng định dạng'),
      password: (value) => (value.length >= 6 ? null : 'Mật khẩu phải có ít nhất 6 ký tự'),
      phone: (value) => (/^(0[3|5|7|8|9])+([0-9]{8})$/.test(value) ? null : 'Số điện thoại không đúng định dạng'),
      fullName: (value) => (activeStep === 1 && !value.trim() ? 'Họ và tên là bắt buộc' : null),
    },
  });

  const nextStep = () => {
    if (activeStep === 0) {
      const hasEmailError = form.validateField('email').hasError;
      const hasPasswordError = form.validateField('password').hasError;
      const hasPhoneError = form.validateField('phone').hasError;
      if (hasEmailError || hasPasswordError || hasPhoneError) return;
    }
    setActiveStep((current) => (current < 1 ? current + 1 : current));
  };

  const prevStep = () => setActiveStep((current) => (current > 0 ? current - 1 : current));

  const handleSubmit = async (values) => {
    setSubmitError(null);
    const result = await signUp(values);
    if (result.success) {
      notifications.show({
        title: 'Đăng ký thành công',
        message: 'Vui lòng kiểm tra email để xác thực tài khoản',
        color: 'teal',
      });
      setRegisteredEmail(values.email);
    } else {
      setSubmitError(result.error);
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
      {/* Cột trái: Ảnh minh họa / Nền gradient thương hiệu (bạn có thể thay ảnh sau) */}
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

      {/* Cột phải: Stepper Đăng ký */}
      <div className={classes.rightSide}>
        <Paper className={classes.form} withBorder={false}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <img
                        src={logo}
                        alt="Owly Logo"
                        style={{
                          width: '90px',
                          height: '90px',
                          objectFit: 'contain',
                        }}
                      />
            <Title order={2} className={classes.title}>
              Đăng ký Giáo viên
            </Title>
            <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.6, marginTop: '0.25rem' }}>
              Điền thông tin để bắt đầu hành trình của bạn
            </Text>
          </div>

          <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false} color="copper" size="sm" mb="xl">
            <Stepper.Step label="Tài khoản" description="Email & bảo mật">
              <div style={{ marginTop: '1.5rem' }}>
                <TextInput
                  required
                  label="Địa chỉ email"
                  placeholder="email@example.com"
                  {...form.getInputProps('email')}
                  size="md"
                  radius="md"
                  styles={{
                    label: { marginBottom: '6px', fontSize: '14px', fontWeight: 500, color: 'var(--text-color)' },
                  }}
                />
                <PasswordInput
                  required
                  label="Mật khẩu"
                  placeholder="Mật khẩu bảo mật"
                  {...form.getInputProps('password')}
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
              </div>
            </Stepper.Step>

            <Stepper.Step label="Hồ sơ" description="Thông tin giảng dạy">
              <div style={{ marginTop: '1.5rem' }}>
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
              </div>
            </Stepper.Step>
          </Stepper>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            {submitError && (
              <Text color="red" size="sm" mb="md" style={{ textAlign: 'center' }}>
                {submitError}
              </Text>
            )}

            <Group justify="space-between" mt="xl">
              {activeStep > 0 ? (
                <Button variant="outline" color="copper" onClick={prevStep} size="md" radius="md">
                  Quay lại
                </Button>
              ) : (
                <div />
              )}

              {activeStep < 1 ? (
                <Button color="copper" onClick={nextStep} size="md" radius="md" className={classes.button}>
                  Tiếp tục
                </Button>
              ) : (
                <Button type="submit" color="copper" loading={loading} size="md" radius="md" className={classes.button}>
                  Đăng ký hoàn tất
                </Button>
              )}
            </Group>
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
