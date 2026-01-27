import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Grid, Card, CardContent } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';
import LiveFeed from '../../components/admin/LiveFeed';

// Simplified mock data specific for review
const MOCK_REVIEW_PROJECTS = [
    { id: 'proj_1', customer_name: 'John Doe', stage: 'Site Survey', status: 'Submitted', last_updated: '2 hrs ago' },
    { id: 'proj_3', customer_name: 'Bob Builder', stage: 'Permitting', status: 'Submitted', last_updated: '5 hrs ago' }
];

const ReviewDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        // Mock fetch pending reviews
        setTimeout(() => setProjects(MOCK_REVIEW_PROJECTS), 300);
    }, []);

    const handleReview = (id: string) => {
        navigate(`/admin/review/${id}`);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Command Center</Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ bgcolor: 'primary.dark', color: 'primary.contrastText' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <Typography variant="h6">Total Active Projects</Typography>
                                    <Typography variant="h3">24</Typography>
                                </div>
                                <TrendingUpIcon fontSize="large" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{ bgcolor: 'warning.dark', color: 'warning.contrastText' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <Typography variant="h6">Pending Reviews</Typography>
                                    <Typography variant="h3">{projects.length}</Typography>
                                </div>
                                <AssignmentLateIcon fontSize="large" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <div>
                                    <Typography variant="h6">Active Installers</Typography>
                                    <Typography variant="h3">8</Typography>
                                </div>
                                <PeopleIcon fontSize="large" color="action" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Content Area */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant="h6" gutterBottom>Pending Submissions</Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Customer</TableCell>
                                    <TableCell>Stage</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Last Updated</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {projects.map((row) => (
                                    <TableRow key={row.id} hover>
                                        <TableCell sx={{ fontWeight: 'bold' }}>{row.customer_name}</TableCell>
                                        <TableCell>{row.stage}</TableCell>
                                        <TableCell>
                                            <Chip label={row.status} color="warning" size="small" />
                                        </TableCell>
                                        <TableCell>{row.last_updated}</TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => handleReview(row.id)}
                                            >
                                                Review
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <LiveFeed />
                </Grid>
            </Grid>
        </Box>
    );
};

export default ReviewDashboard;

