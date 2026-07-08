import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'copper',
  defaultRadius: 'md',
  fontFamily: 'Geist, system-ui, -apple-system, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  colors: {
    copper: [
      '#faf8f2', // 0
      '#f2ebdb', // 1
      '#e6d7b8', // 2
      '#d8c091', // 3
      '#caa86d', // 4
      '#C5A880', // 5 - Light Accent
      '#bfa061', // 6
      '#D4AF37', // 7 - Dark Accent
      '#ad8a23', // 8
      '#856816', // 9
    ],
    prussian: [
      '#f1f6f1', // 0
      '#e0ebe0', // 1
      '#c2d7c2', // 2
      '#a0c0a0', // 3
      '#7aa279', // 4
      '#4E8F4A', // 5 - Dark Primary
      '#2D5A27', // 6 - Light Primary
      '#244b1f', // 7
      '#1c3b18', // 8
      '#122710', // 9
    ],
  },
  components: {
    Button: {
      defaultProps: {
        loaderProps: { type: 'dots' },
      },
    },
  },
});

