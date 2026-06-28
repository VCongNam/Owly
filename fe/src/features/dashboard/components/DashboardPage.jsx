import { Container, Card, Title, Text, Button, Group } from '@mantine/core';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth';

export function DashboardPage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <Container size="md" style={{ py: '3rem', minHeight: 'calc(100vh - 180px)', display: 'flex', alignItems: 'center' }}>
      <Card
        withBorder
        shadow="sm"
        p="xl"
        radius="md"
        style={{
          width: '100%',
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-color)',
        }}
      >
        <Title order={1} mb="xs" style={{ color: 'var(--text-color)', fontWeight: 800 }}>
          Bảng điều khiển Owly
        </Title>
        <Text size="md" mb="lg" style={{ color: 'var(--text-color)', opacity: 0.8 }}>
          Chào mừng giáo viên, <strong>{user.fullName || user.email}</strong>. Hệ thống quản lý lớp học và chuyên môn của bạn đã sẵn sàng.
        </Text>

        <Group>
          <Button color="copper" variant="filled">
            Quản lý Lớp học
          </Button>
          <Button color="copper" variant="outline" onClick={logout}>
            Đăng xuất
          </Button>
        </Group>
      </Card>
    </Container>
  );
}

export default DashboardPage;
