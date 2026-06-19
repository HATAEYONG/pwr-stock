import { createTheme } from '@mui/material/styles';

// 테마 생성 - 가독성을 위해 글자 크기 증가
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
      light: '#8e9bf3',
      dark: '#4552b5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#a07cc4',
      dark: '#4e2b7a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#4a5568',
    },
    success: {
      main: '#48bb78',
      light: '#68d391',
      dark: '#38a169',
    },
    warning: {
      main: '#ed8936',
      light: '#f0a462',
      dark: '#dd6b20',
    },
    error: {
      main: '#f56565',
      light: '#f87877',
      dark: '#e53e3e',
    },
    info: {
      main: '#4299e1',
      light: '#63b3ed',
      dark: '#3182ce',
    },
  },
  typography: {
    // 전체 기본 글자 크기 증가
    fontSize: 18, // 16 -> 18 (더 크게)
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      'cursive',
    ].join(','),
    h1: {
      fontSize: '3rem', // 2.5rem -> 3rem
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.5rem', // 2rem -> 2.5rem
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '2rem', // 1.75rem -> 2rem
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.75rem', // 1.5rem -> 1.75rem
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem', // 1.25rem -> 1.5rem
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.25rem', // 1.1rem -> 1.25rem
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1.25rem', // 1.1rem -> 1.25rem
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '1.1rem', // 1rem -> 1.1rem
      fontWeight: 500,
    },
    body1: {
      fontSize: '1.125rem', // 1rem -> 1.125rem
      fontWeight: 400,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '1.05rem', // 0.95rem -> 1.05rem
      fontWeight: 400,
      lineHeight: 1.5,
    },
    button: {
      fontSize: '1.1rem', // 1rem -> 1.1rem
      fontWeight: 600,
      textTransform: 'none', // 대문자 변환 제거
    },
    caption: {
      fontSize: '1rem', // 0.9rem -> 1rem
      fontWeight: 400,
    },
  },
  components: {
    // MuiButton 스타일 개선
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // 둥근 모서리 증가
          padding: '10px 24px',
          fontSize: '1.1rem', // 1rem -> 1.1rem (더 크게)
          fontWeight: 600,
          textTransform: 'none', // 대문자 변환 제거
        },
        contained: {
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 6px 8px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
            transition: 'all 0.2s ease-in-out',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    // MuiCard 스타일 개선
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
            transition: 'all 0.3s ease-in-out',
          },
        },
      },
    },
    // MuiPaper 스타일 개선
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation1: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    // MuiTableCell 스타일 개선
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '1.05rem', // 1rem -> 1.05rem (더 크게)
          padding: '12px 16px',
        },
        head: {
          fontSize: '1.1rem', // 1rem -> 1.1rem
          fontWeight: 700,
          backgroundColor: '#f7fafc',
        },
      },
    },
    // MuiTypography 스타일 개선
    MuiTypography: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem', // 1rem -> 1.125rem (더 크게)
        },
        h1: {
          fontSize: '3rem',
        },
        h2: {
          fontSize: '2.5rem',
        },
        h3: {
          fontSize: '2rem',
        },
        h4: {
          fontSize: '1.75rem',
        },
        h5: {
          fontSize: '1.5rem',
        },
        h6: {
          fontSize: '1.25rem',
        },
        body1: {
          fontSize: '1.125rem',
        },
        body2: {
          fontSize: '1.05rem',
        },
        button: {
          fontSize: '1.1rem',
        },
      },
    },
    // MuiInput 스타일 개선
    MuiInput: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          backgroundColor: '#ffffff',
        },
        input: {
          fontSize: '1rem',
        },
      },
    },
    // MuiTextField 스타일 개선
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-input': {
            fontSize: '1rem',
          },
        },
      },
    },
    // MuiSelect 스타일 개선
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
        },
        select: {
          fontSize: '1rem',
        },
      },
    },
    // MuiMenuItem 스타일 개선
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem', // 1rem -> 1.1rem (더 크게)
          padding: '12px 16px',
          minHeight: '48px',
        },
      },
    },
    // MuiTab 스타일 개선
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem', // 1rem -> 1.1rem (더 크게)
          fontWeight: 600,
          textTransform: 'none', // 대문자 변환 제거
          minHeight: '48px',
        },
      },
    },
    // MuiChip 스타일 개선
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: '1rem', // 0.95rem -> 1rem (더 크게)
          fontWeight: 500,
        },
        label: {
          fontSize: '1rem',
        },
      },
    },
    // MuiDialogContent 스타일 개선
    MuiDialogContent: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem', // 1rem -> 1.1rem (더 크게)
        },
      },
    },
    // MuiDialogActions 스타일 개선
    MuiDialogActions: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem', // 1rem -> 1.1rem (더 크게)
        },
      },
    },
    // MuiAlert 스타일 개선
    MuiAlert: {
      styleOverrides: {
        root: {
          fontSize: '1.1rem', // 1rem -> 1.1rem (더 크게)
          borderRadius: 12,
        },
        message: {
          fontSize: '1.1rem',
        },
      },
    },
    // MuiLinearProgress 스타일 개선
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 8,
        },
      },
    },
    // MuiTablePagination 스타일 개선
    MuiTablePagination: {
      styleOverrides: {
        root: {
          fontSize: '1rem', // 0.95rem -> 1rem (더 크게)
        },
        selectLabel: {
          fontSize: '1rem',
        },
        displayedRows: {
          fontSize: '1rem',
        },
      },
    },
  },
  shape: {
    borderRadius: 12, // 전체 둥근 모서리 증가
  },
  shadows: [
    'none',
    '0 2px 4px rgba(0,0,0,0.06)',
    '0 4px 8px rgba(0,0,0,0.08)',
    '0 6px 12px rgba(0,0,0,0.10)',
    '0 8px 16px rgba(0,0,0,0.12)',
    '0 12px 24px rgba(0,0,0,0.14)',
    '0 16px 32px rgba(0,0,0,0.16)',
    '0 20px 40px rgba(0,0,0,0.18)',
    '0 24px 48px rgba(0,0,0,0.20)',
    '0 28px 56px rgba(0,0,0,0.22)',
    '0 32px 64px rgba(0,0,0,0.24)',
    '0 36px 72px rgba(0,0,0,0.26)',
    '0 40px 80px rgba(0,0,0,0.28)',
    '0 44px 88px rgba(0,0,0,0.30)',
    '0 48px 96px rgba(0,0,0,0.32)',
    '0 52px 104px rgba(0,0,0,0.34)',
    '0 56px 112px rgba(0,0,0,0.36)',
    '0 60px 120px rgba(0,0,0,0.38)',
    '0 64px 128px rgba(0,0,0,0.40)',
    '0 68px 136px rgba(0,0,0,0.42)',
    '0 72px 144px rgba(0,0,0,0.44)',
    '0 76px 152px rgba(0,0,0,0.46)',
    '0 80px 160px rgba(0,0,0,0.48)',
    '0 84px 168px rgba(0,0,0,0.50)',
    '0 88px 176px rgba(0,0,0,0.52)',
  ],
  props: {
    MuiButton: {
      disableRipple: false, // 클릭 효과 유지
    },
    MuiCard: {
      elevation: 2, // 기본 그림자 증가
    },
  },
});

export default theme;
