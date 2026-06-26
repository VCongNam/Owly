import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, Container, Title, Text, Card, Button, Group } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { useAuth } from './hooks/useAuth';
import { supabase } from './services/supabaseClient';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';

// Simple dashboard placeholder for logged-in users
function Home() {
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

export function App() {
  const { setSession } = useAuth();

  useEffect(() => {
    // 1. Kiểm tra session hiện tại khi ứng dụng khởi chạy
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session.user, session.access_token);
      }
    });

    // 2. Lắng nghe thay đổi trạng thái xác thực từ Supabase (Đăng nhập, Đăng xuất, Refresh Token...)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSession(session.user, session.access_token);
      } else {
        setSession(null, null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" zIndex={1000} />
      <BrowserRouter>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <main style={{ flex: 1, backgroundColor: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;

