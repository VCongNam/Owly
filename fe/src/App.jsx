import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { useAuthStore } from './features/auth/hooks/useAuth';
import { apiClient } from './services/apiClient';
import { AppRoutes } from './routes/AppRoutes';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';

function AppInner() {
  // Đồng bộ axios Authorization header từ token đã có trong store (đọc từ localStorage/sessionStorage)
  useEffect(() => {
    const token = useAuthStore.getState().token;
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  return <AppRoutes />;
}

export function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-right" zIndex={1000} />
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
