import { Paper, Title, Text, PasswordInput, Button, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import logo from '../../../assets/logo.png';
import classes from './AuthenticationImage.module.css';

export function ChangePassword() {
  const { changePassword, loading } = useAuth();
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
    validate: {
      newPassword: (value) => (value.length >= 6 ? null : 'Mật khẩu mới phải có ít nhất 6 ký tự'),
      confirmNewPassword: (value, values) => (value === values.newPassword ? null : 'Mật khẩu xác nhận không khớp'),
    },
  });

  const handleSubmit = async (values) => {
    const result = await changePassword(values.newPassword, values.confirmNewPassword);
    if (result.success) {
      notifications.show({
        title: 'Đổi mật khẩu thành công',
        message: 'Mật khẩu mới của bạn đã được cập nhật thành công',
        color: 'teal',
      });
      navigate('/');
    } else {
      notifications.show({
        title: 'Đổi mật khẩu thất bại',
        message: result.error || 'Đã xảy ra lỗi trong quá trình đổi mật khẩu',
        color: 'red',
      });
    }
  };

  return (
    <div className={classes.wrapper}>
      {/* Cột trái: Ảnh minh họa / Nền gradient */}
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
            Cập nhật và duy trì độ bảo mật cho tài khoản của bạn.
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

      {/* Cột phải: Form nhập mật khẩu mới */}
      <div className={classes.rightSide}>
        <Paper className={classes.form} withBorder={false}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Title order={2} className={classes.title}>
              Đổi mật khẩu
            </Title>
            <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.6, marginTop: '0.25rem' }}>
              Hãy nhập mật khẩu mới của bạn dưới đây
            </Text>
          </div>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <PasswordInput
              required
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới của bạn"
              size="md"
              radius="md"
              {...form.getInputProps('newPassword')}
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
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
              mt="md"
              size="md"
              radius="md"
              {...form.getInputProps('confirmNewPassword')}
              styles={{
                label: {
                  marginBottom: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--text-color)',
                },
              }}
            />
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
              Cập nhật mật khẩu
            </Button>
          </form>

          <Text ta="center" mt="lg" size="sm" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
            <Anchor component={Link} to="/" fw={600} color="copper">
              Quay lại Trang chủ
            </Anchor>
          </Text>
        </Paper>
      </div>
    </div>
  );
}

export default ChangePassword;
