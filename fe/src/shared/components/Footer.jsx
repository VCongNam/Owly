import { Container, Grid, Text, Stack, Group } from '@mantine/core';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        backgroundColor: 'var(--card-bg)',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '3rem',
        paddingBottom: '2rem',
        marginTop: 'auto',
      }}
    >
      <Container size="lg">
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="sm">
              <Group gap="xs">
                <img
                  src={logo}
                  alt="Owly Logo"
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'contain',
                  }}
                />
                <Text size="md" fw={700} style={{ color: 'var(--text-color)' }}>
                  Owly
                </Text>
              </Group>
              <Text size="sm" style={{ color: 'var(--text-color)', opacity: 0.7, maxWidth: '300px' }}>
                Hệ thống quản lý lớp học và tài chính hiệu quả dành cho giáo viên và các trung tâm giáo dục.
              </Text>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 6, md: 4 }}>
            <Stack gap="xs">
              <Text size="sm" fw={600} style={{ color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Liên kết
              </Text>
              <Link to="/#features" style={{ textDecoration: 'none', color: 'var(--text-color)', opacity: 0.8, fontSize: '0.9rem' }}>Tính năng</Link>
              <Link to="/#pricing" style={{ textDecoration: 'none', color: 'var(--text-color)', opacity: 0.8, fontSize: '0.9rem' }}>Bảng giá</Link>
              <Link to="/#support" style={{ textDecoration: 'none', color: 'var(--text-color)', opacity: 0.8, fontSize: '0.9rem' }}>Hỗ trợ</Link>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 6, md: 4 }}>
            <Stack gap="xs">
              <Text size="sm" fw={600} style={{ color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Điều khoản
              </Text>
              <Link to="/terms" style={{ textDecoration: 'none', color: 'var(--text-color)', opacity: 0.8, fontSize: '0.9rem' }}>Điều khoản dịch vụ</Link>
              <Link to="/privacy" style={{ textDecoration: 'none', color: 'var(--text-color)', opacity: 0.8, fontSize: '0.9rem' }}>Chính sách bảo mật</Link>
            </Stack>
          </Grid.Col>
        </Grid>

        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <Text size="xs" style={{ color: 'var(--text-color)', opacity: 0.6 }}>
            Bản quyền thuộc về Owly. Bảo lưu mọi quyền.
          </Text>
          <Text size="xs" style={{ color: 'var(--text-color)', opacity: 0.6 }}>
            &copy; {currentYear} Owly.
          </Text>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
