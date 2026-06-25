import { useState } from 'react';
import { Container, Card, Title, Text, TextInput, PasswordInput, Button, Stack, Anchor, Group } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';

export function SignIn() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email không đúng định dạng'),
      password: (value) => (value.length >= 6 ? null : 'Mật khẩu phải có ít nhất 6 ký tự'),
    },
  });

  const handleSubmit = async (values) => {
    setAuthError(null);
    const result = await login(values.email, values.password);
    if (result.success) {
      notifications.show({
        title: 'Đăng nhập thành công',
        message: 'Chào mừng bạn quay trở lại với Owly',
        color: 'teal',
      });
      navigate('/');
    } else {
      setAuthError(result.error);
    }
  };

  return (
    <Container size="xs" style={{ minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
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
            Đăng nhập tài khoản
          </Title>
          <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.7 }}>
            Quản lý và cập nhật hoạt động lớp học của bạn
          </Text>
        </Stack>

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              required
              label="Địa chỉ Email"
              placeholder="email@example.com"
              {...form.getInputProps('email')}
              styles={{
                input: {
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  borderColor: 'var(--border-color)',
                },
                label: {
                  color: 'var(--text-color)',
                  fontWeight: 500,
                  marginBottom: '4px',
                },
              }}
            />

            <PasswordInput
              required
              label="Mật khẩu"
              placeholder="Mật khẩu của bạn"
              {...form.getInputProps('password')}
              styles={{
                input: {
                  backgroundColor: 'var(--bg-color)',
                  color: 'var(--text-color)',
                  borderColor: 'var(--border-color)',
                },
                label: {
                  color: 'var(--text-color)',
                  fontWeight: 500,
                  marginBottom: '4px',
                },
              }}
            />

            {/* {authError && (
              <Text color="red" size="sm" style={{ textAlign: 'center' }}>
                {authError}
              </Text>
            )} */}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              color="copper"
              size="md"
              style={{ marginTop: '0.5rem' }}
            >
              Đăng nhập
            </Button>
          </Stack>
        </form>

        <Group justify="center" mt="xl">
          <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
            Chưa có tài khoản?{' '}
            <Anchor component={Link} to="/signup" color="copper" fw={600}>
              Đăng ký ngay
            </Anchor>
          </Text>
        </Group>
      </Card>
    </Container>
  );
}

export default SignIn;
