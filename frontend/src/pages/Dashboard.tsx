import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

const Dashboard: React.FC = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                        <Typography component="h2" variant="h6" color="primary" gutterBottom>
                            Active Projects
                        </Typography>
                        <Typography component="p" variant="h3">
                            12
                        </Typography>
                        <Typography color="text.secondary" sx={{ flex: 1 }}>
                            Total in progress
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                        <Typography component="h2" variant="h6" color="error" gutterBottom>
                            Action Required
                        </Typography>
                        <Typography component="p" variant="h3">
                            3
                        </Typography>
                        <Typography color="text.secondary" sx={{ flex: 1 }}>
                            Blocked items
                        </Typography>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
                        <Typography component="h2" variant="h6" color="success.main" gutterBottom>
                            Approvals
                        </Typography>
                        <Typography component="p" variant="h3">
                            5
                        </Typography>
                        <Typography color="text.secondary" sx={{ flex: 1 }}>
                            Approved this week
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;
