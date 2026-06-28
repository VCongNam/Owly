import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';
import { useAuth } from './features/auth';
import { supabase } from './services/supabaseClient';
import { AppRoutes } from './routes/AppRoutes';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';

function AppInner() {
  const { setSession } = useAuth();

  useEffect(() => {
    // 1. Kiểm tra session hiện tại khi ứng dụng khởi chạy
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session.user, session.access_token);
      }
    });

    // 2. Lắng nghe thay đổi trạng thái xác thực từ Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSession(session.user, session.access_token);
      } else {
        setSession(null, null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

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
