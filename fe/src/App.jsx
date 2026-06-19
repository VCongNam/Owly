import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';

export function App() {
  return (
    <MantineProvider theme={theme}>
      <Notifications position="top-right" zIndex={1000} />
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Owly Project Structure</h1>
        <p>Mantine UI and project directories are configured. Code is ready to be written.</p>
      </div>
    </MantineProvider>
  );
}

export default App;
