import { createTheme, styled } from '@mui/material/styles';
import {
  Card,
  Chip,
  LinearProgress,
  TableCell,
  ImageList,
  Button
} from '@mui/material';

// Tema
export const theme = createTheme({
  palette: {
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20'
    },
    secondary: {
      main: '#FF6F00',
      light: '#FF9800',
      dark: '#E65100'
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C'
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00'
    },
    error: {
      main: '#F44336',
      light: '#EF5350',
      dark: '#D32F2F'
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0'
        }
      }
    }
  }
});

export const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
  }
}));

export const StatusChip = styled(Chip)(({ status, theme }) => ({
  fontWeight: 600,
  ...(status === 'pendiente' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  }),
  ...(status === 'Devuelto' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  }),
  ...(status === 'Realizado' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  })
}));

export const ProgressBar = styled(LinearProgress)(({ percentage, theme }) => ({
  height: 12,
  borderRadius: 6,
  backgroundColor: theme.palette.grey[200],
  '& .MuiLinearProgress-bar': {
    borderRadius: 6,
    ...(percentage >= 90 && { backgroundColor: theme.palette.success.main }),
    ...(percentage >= 80 && percentage < 90 && { backgroundColor: theme.palette.success.light }),
    ...(percentage >= 60 && percentage < 80 && { backgroundColor: theme.palette.warning.main }),
    ...(percentage < 60 && { backgroundColor: theme.palette.error.main }),
  }
}));

export const ConformityCell = styled(TableCell)(({ selected, type, theme }) => ({
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  ...(selected && type === 'Conforme' && {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  }),
  ...(selected && type === 'm' && {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  }),
  ...(selected && type === 'M' && {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  }),
  ...(selected && type === 'C' && {
    backgroundColor: theme.palette.grey[400],
    color: theme.palette.common.white,
  }),
  ...(selected && type === 'NA' && {
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
  }),
  '&:hover': {
    backgroundColor: selected ? undefined : theme.palette.action.hover,
  }
}));

export const ImageGallery = styled(ImageList)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

export const ActionButton = styled(Button)(({ theme, varianttype }) => ({
  fontWeight: 600,
  borderRadius: 8,
  textTransform: 'none',
  padding: '8px 16px',
  ...(varianttype === 'save' && {
    backgroundColor: theme.palette.info.main,
    '&:hover': {
      backgroundColor: theme.palette.info.dark,
    }
  }),
  ...(varianttype === 'generate' && {
    backgroundColor: theme.palette.success.main,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    }
  })
}));