import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Divider,
    ListSubheader,
    Box
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PendingIcon from '@mui/icons-material/Pending';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const drawerWidth = 240;

interface SidebarProps {
    mobileOpen: boolean;
    handleDrawerToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, handleDrawerToggle }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigation = (path: string) => {
        navigate(path);
        // Close mobile drawer if open
        if (mobileOpen) {
            handleDrawerToggle();
        }
    };



    // ... (imports)

    // ...

    const drawerContent = (
        <div>
            <Toolbar>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                    <Logo inverted />
                </Box>
            </Toolbar>
            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

            {/* Installer Section */}
            <List
                subheader={
                    <ListSubheader component="div" sx={{ bgcolor: 'transparent', color: 'primary.main', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                        Installer Portal
                    </ListSubheader>
                }
            >
                <ListItem disablePadding>
                    <ListItemButton
                        selected={location.pathname === '/'}
                        onClick={() => handleNavigation('/')}
                    >
                        <ListItemIcon><DashboardIcon /></ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        selected={location.pathname === '/projects/new'}
                        onClick={() => handleNavigation('/projects/new')}
                    >
                        <ListItemIcon><AddIcon /></ListItemIcon>
                        <ListItemText primary="New Project" />
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton
                        selected={location.pathname === '/projects'}
                        onClick={() => handleNavigation('/projects')}
                    >
                        <ListItemIcon><ListAltIcon /></ListItemIcon>
                        <ListItemText primary="My Projects" />
                    </ListItemButton>
                </ListItem>
            </List>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />

            {/* Admin Section */}
            <Box sx={{ bgcolor: 'rgba(255, 111, 0, 0.05)' }}> {/* Subtle orange tint for admin area */}
                <List
                    subheader={
                        <ListSubheader component="div" sx={{ bgcolor: 'transparent', color: 'error.main', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                            Admin Tools
                        </ListSubheader>
                    }
                >
                    <ListItem disablePadding>
                        <ListItemButton
                            selected={location.pathname === '/command-center'}
                            onClick={() => handleNavigation('/command-center')}
                        >
                            <ListItemIcon><AssignmentIcon sx={{ color: 'error.light' }} /></ListItemIcon>
                            <ListItemText primary="Command Center" />
                        </ListItemButton>
                    </ListItem>

                    <ListItem disablePadding>
                        <ListItemButton
                            selected={location.pathname === '/admin/organizations'}
                            onClick={() => handleNavigation('/admin/organizations')}
                        >
                            <ListItemIcon><DashboardIcon sx={{ color: 'error.light' }} /></ListItemIcon>
                            <ListItemText primary="Organizations" />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleNavigation('/admin/data-collection')}>
                            <ListItemIcon><SettingsIcon sx={{ color: 'error.light' }} /></ListItemIcon>
                            <ListItemText primary="Workflow Config" secondary="Stages, Sections, Questions" secondaryTypographyProps={{ sx: { color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' } }} />
                        </ListItemButton>
                    </ListItem>
                    <ListItem disablePadding>
                        <ListItemButton onClick={() => handleNavigation('/debug/evaluation')}>
                            <ListItemIcon><PendingIcon sx={{ color: 'error.light' }} /></ListItemIcon>
                            <ListItemText primary="System Debugger" />
                        </ListItemButton>
                    </ListItem>
                </List>
            </Box>
        </div>
    );

    return (
        <Box
            component="nav"
            sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            aria-label="mailbox folders"
        >
            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        backgroundColor: '#111827',
                        color: '#ffffff'
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Desktop Drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        boxSizing: 'border-box',
                        width: drawerWidth,
                        backgroundColor: '#111827',
                        color: '#ffffff'
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
};

export default Sidebar;
