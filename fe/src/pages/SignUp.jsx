import { useState, useEffect } from 'react';
import { Container, Card, Title, Text, TextInput, PasswordInput, Button, Stack, Stepper, MultiSelect, Anchor, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/apiClient';
import { notifications } from '@mantine/notifications';

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
        // Assuming subjects list returns [{ id, name, code }]
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
    // Validate step 0 fields
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
      <Container size="sm" style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <Card
          withBorder
          shadow="md"
          p="xl"
          radius="md"
          style={{
            width: '100%',
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
            boxShadow: '0 8px 30px var(--shadow-color)',
            textAlign: 'center',
          }}
        >
          <Stack align="center" gap="md">
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
              }}
            >
              ✉
            </div>
            <Title order={2} style={{ color: 'var(--text-color)', fontWeight: 800 }}>
              Xác thực tài khoản của bạn
            </Title>
            <Text size="md" style={{ color: 'var(--text-color)', opacity: 0.8, maxWidth: '450px' }}>
              Chúng tôi đã gửi một email kích hoạt tài khoản đến địa chỉ{' '}
              <strong>{registeredEmail}</strong>. Vui lòng kiểm tra hộp thư của bạn và nhấn vào liên kết xác thực trước khi tiến hành đăng nhập.
            </Text>
            <Button
              color="copper"
              onClick={() => navigate('/signin')}
              style={{ marginTop: '1rem', width: '200px' }}
            >
              Đi tới đăng nhập
            </Button>
          </Stack>
        </Card>
      </Container>
    );
  }

  return (
    <Container size="sm" style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <Card
        withBorder
        shadow="md"
        p="xl"
        radius="md"
        style={{
          width: '100%',
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
          boxShadow: '0 8px 30px var(--shadow-color)',
        }}
      >
        <Stack align="center" gap="xs" mb="lg">
          <Title order={2} style={{ color: 'var(--text-color)', fontWeight: 800 }}>
            Đăng ký tài khoản Giáo viên
          </Title>
          <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.7 }}>
            Khởi tạo hệ thống quản lý lớp học Owly của riêng bạn
          </Text>
        </Stack>

        <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false} color="copper" size="sm" mb="xl">
          <Stepper.Step label="Tài khoản" description="Email và mật khẩu">
            <Stack gap="md" mt="md">
              <TextInput
                required
                label="Địa chỉ Email"
                placeholder="email@example.com"
                {...form.getInputProps('email')}
                styles={{
                  input: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' },
                  label: { color: 'var(--text-color)', fontWeight: 500 },
                }}
              />
              <PasswordInput
                required
                label="Mật khẩu"
                placeholder="Mật khẩu bảo mật"
                {...form.getInputProps('password')}
                styles={{
                  input: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' },
                  label: { color: 'var(--text-color)', fontWeight: 500 },
                }}
              />
              <TextInput
                required
                label="Số điện thoại"
                placeholder="0987654321"
                {...form.getInputProps('phone')}
                styles={{
                  input: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' },
                  label: { color: 'var(--text-color)', fontWeight: 500 },
                }}
              />
            </Stack>
          </Stepper.Step>

          <Stepper.Step label="Hồ sơ" description="Thông tin giảng dạy">
            <Stack gap="md" mt="md">
              <TextInput
                required
                label="Họ và tên"
                placeholder="Nguyễn Văn Nam"
                {...form.getInputProps('fullName')}
                styles={{
                  input: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' },
                  label: { color: 'var(--text-color)', fontWeight: 500 },
                }}
              />
              <MultiSelect
                label="Môn học chuyên môn"
                placeholder={loadingSubjects ? 'Đang tải môn học...' : 'Chọn môn học giảng dạy'}
                data={subjects}
                disabled={loadingSubjects}
                {...form.getInputProps('specializationIds')}
                styles={{
                  input: { backgroundColor: 'var(--bg-color)', color: 'var(--text-color)', borderColor: 'var(--border-color)' },
                  label: { color: 'var(--text-color)', fontWeight: 500 },
                }}
              />
            </Stack>
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
              <Button variant="outline" color="copper" onClick={prevStep}>
                Quay lại
              </Button>
            ) : (
              <div />
            )}

            {activeStep < 1 ? (
              <Button color="copper" onClick={nextStep}>
                Tiếp tục
              </Button>
            ) : (
              <Button type="submit" color="copper" loading={loading}>
                Đăng ký hoàn tất
              </Button>
            )}
          </Group>
        </form>

        <Group justify="center" mt="xl">
          <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
            Đã có tài khoản?{' '}
            <Anchor component={Link} to="/signin" color="copper" fw={600}>
              Đăng nhập
            </Anchor>
          </Text>
        </Group>
      </Card>
    </Container>
  );
}

export default SignUp;
