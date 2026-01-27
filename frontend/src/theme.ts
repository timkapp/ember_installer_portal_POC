import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#ff6f00', // Ember Orange
            dark: '#c43e00',
            light: '#ff9e40',
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#263238', // Dark Blue/Grey
            light: '#4f5b62',
            dark: '#000a12',
            contrastText: '#ffffff',
        },
        background: {
            default: '#f5f5f5',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: { fontWeight: 700 },
        h2: { fontWeight: 700 },
        h3: { fontWeight: 700 },
        h4: { fontWeight: 600, letterSpacing: '-0.5px' },
        h5: { fontWeight: 600 },
        h6: { fontWeight: 600 },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    boxShadow: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: { borderRadius: 12 }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: { borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
            }
        },

        MuiListItemButton: {
            styleOverrides: {
                root: {
                    '&.Mui-selected': {
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.12)',
                        },
                    },
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    },
                },
            },
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: 'rgba(255, 255, 255, 0.7)',
                },
            },
        },
    },
});

export default theme;
