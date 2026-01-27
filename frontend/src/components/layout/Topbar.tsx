import React from 'react';
import { AppBar, IconButton, Toolbar, Typography, Avatar, Box, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

interface TopbarProps {
    handleDrawerToggle: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ handleDrawerToggle }) => {
    const { user, signOut } = useAuth();

    return (
        <AppBar
            position="fixed"
            sx={{
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                ml: { sm: `${drawerWidth}px` },
                bgcolor: 'background.paper',
                color: 'text.primary',
                boxShadow: 1,
            }}
        >
            <Toolbar>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {/* Page Title could go here based on route */}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2">
                        {user?.email || 'Guest'}
                    </Typography>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {user?.email ? user.email[0].toUpperCase() : 'G'}
                    </Avatar>
                    {user && (
                        <Button onClick={signOut} color="inherit" size="small">
                            Logout
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Topbar;
