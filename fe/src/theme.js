import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'copper',
  defaultRadius: 'md',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  colors: {
    copper: [
      '#fdf2f4', // 0
      '#fbe5e8', // 1
      '#f7ccd2', // 2
      '#f0a3af', // 3
      '#e6778b', // 4
      '#d8526d', // 5
      '#c87a8a', // 6 - Main Light Accent
      '#b14c62', // 7
      '#933d50', // 8
      '#7b3442', // 9
    ],
    prussian: [
      '#f3f6fa', // 0
      '#e4ecf3', // 1
      '#cddbe8', // 2
      '#a7c1d7', // 3
      '#7aa1c1', // 4
      '#5883a9', // 5
      '#446a8d', // 6
      '#375573', // 7
      '#22354a', // 8
      '#111e2e', // 9 - Main Dark Base
    ],
  },
  components: {
    Button: {
      defaultProps: {
        loaderProps: { type: 'dots' },
      },
    },
    Input: {
      styles: () => ({
        input: {
          '&:focus-within': {
            borderColor: '#c87a8a',
          },
        },
      }),
    },
  },
});

