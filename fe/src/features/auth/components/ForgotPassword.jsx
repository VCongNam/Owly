import { useState } from 'react';
import { Paper, Title, Text, TextInput, Button, Anchor, Box } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { notifications } from '@mantine/notifications';
import logo from '../../../assets/logo.png';
import classes from './AuthenticationImage.module.css';

export function ForgotPassword() {
  const { forgotPassword, loading } = useAuth();
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const form = useForm({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : 'Email không đúng định dạng'),
    },
  });

  const handleSubmit = async (values) => {
    const result = await forgotPassword(values.email);
    if (result.success) {
      notifications.show({
        title: 'Gửi yêu cầu thành công',
        message: 'Vui lòng kiểm tra hộp thư của bạn để lấy liên kết khôi phục',
        color: 'teal',
      });
      setRegisteredEmail(values.email);
      setEmailSent(true);
    } else {
      notifications.show({
        title: 'Yêu cầu thất bại',
        message: result.error || 'Đã có lỗi xảy ra. Vui lòng kiểm tra lại địa chỉ email.',
        color: 'red',
      });
    }
  };

  if (emailSent) {
    return (
      <div className={classes.wrapper}>
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
              Hệ thống quản lý thông minh giúp giáo viên kết nối và vận hành lớp học một cách tinh tế nhất.
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
        <div className={classes.rightSide}>
          <Paper className={classes.form} radius="md" p="xl" withBorder={false}>
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
                Kiểm tra email của bạn
              </Title>
              <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.8, marginTop: '1rem', lineHeight: '1.6' }}>
                Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu tới địa chỉ <strong>{registeredEmail}</strong>. Vui lòng làm theo hướng dẫn trong email.
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
                Quay lại đăng nhập
              </Button>
            </div>
          </Paper>
        </div>
      </div>
    );
  }

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
            Hệ thống quản lý thông minh giúp giáo viên kết nối và vận hành lớp học một cách tinh tế nhất.
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

      {/* Cột phải: Form khôi phục mật khẩu */}
      <div className={classes.rightSide}>
        <Paper className={classes.form} withBorder={false}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Title order={2} className={classes.title}>
              Quên mật khẩu?
            </Title>
            <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.6, marginTop: '0.25rem' }}>
              Nhập email đăng ký của bạn để thiết lập mật khẩu mới
            </Text>
          </div>

          <form onSubmit={form.onSubmit(handleSubmit)}>
            <TextInput
              required
              label="Địa chỉ email"
              placeholder="email@example.com"
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
              Gửi email khôi phục
            </Button>
          </form>

          <Text ta="center" mt="lg" size="sm" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
            <Anchor component={Link} to="/signin" fw={600} color="copper">
              Quay lại Đăng nhập
            </Anchor>
          </Text>
        </Paper>
      </div>
    </div>
  );
}

export default ForgotPassword;
