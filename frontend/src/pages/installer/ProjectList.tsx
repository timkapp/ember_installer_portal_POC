import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import * as projectService from '../../services/projectService';


// UI Model for Table
interface ProjectRow {
    id: string;
    customer_name: string;
    address: string;
    status: string;
    stage: string; // This might need Stage integration later
}

const ProjectList: React.FC = () => {
    const navigate = useNavigate();
    const [projectRows, setProjectRows] = useState<ProjectRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [projects, customers] = await Promise.all([
                    projectService.getProjects(),
                    projectService.getCustomers()
                ]);

                // Join Data
                const rows: ProjectRow[] = projects.map(p => {
                    const customer = customers.find(c => c.id === p.customer_id);
                    return {
                        id: p.id,
                        customer_name: customer ? customer.name : 'Unknown',
                        address: customer ? customer.address : '-',
                        status: p.status || 'Pending',
                        stage: 'Unknown' // TODO: Join with StageAssignment
                    };
                });
                setProjectRows(rows);
            } catch (error) {
                console.error("Failed to load projects:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleOpenProject = (id: string) => {
        navigate(`/projects/${id}`);
    };

    if (loading) {
        return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading projects...</Typography></Box>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Projects</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Customer</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>Stage</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {projectRows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No projects found.</TableCell>
                            </TableRow>
                        ) : (
                            projectRows.map((project) => (
                                <TableRow key={project.id} hover>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{project.customer_name}</TableCell>
                                    <TableCell>{project.address}</TableCell>
                                    <TableCell>{project.stage}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={project.status}
                                            color={project.status === 'Action Required' ? 'error' : 'primary'}
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={() => handleOpenProject(project.id)} color="primary">
                                            <ArrowForwardIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ProjectList;
