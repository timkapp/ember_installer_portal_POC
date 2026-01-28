import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, CircularProgress, Button, Chip, Grid, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CreditApprovalSelector from '../../components/installer/CreditApprovalSelector';
import { getCreditApprovals, createProject, type CreditApproval } from '../../lib/projectService';

const NewProjectWizard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [approvals, setApprovals] = useState<CreditApproval[]>([]);
    const [selectedApproval, setSelectedApproval] = useState<CreditApproval | null>(null);

    useEffect(() => {
        // Load approvals on mount
        const load = async () => {
            const data = await getCreditApprovals('org_1'); // Mock org ID
            setApprovals(data);
        };
        load();
    }, []);

    const handleSelectApproval = (approval: CreditApproval) => {
        setSelectedApproval(approval);
    };

    const handleConfirmCreate = async () => {
        if (!selectedApproval) return;
        setLoading(true);
        try {
            // Auto-map customer data from approval
            const customerData = {
                name: selectedApproval.customer_name,
                email: selectedApproval.customer_email,
                address: selectedApproval.customer_address,
                phone: ''
            };

            const projectId = await createProject(selectedApproval, customerData);
            // alert(`Project Created! Customer Status: ${selectedApproval.match_status}`);
            navigate(`/projects/${projectId}`);
        } catch (e) {
            console.error(e);
            alert('Failed to create project');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 'xl', mx: 'auto', mt: 4, px: 2 }}>
            <Typography variant="h4" gutterBottom>New Project</Typography>

            {!selectedApproval ? (
                <>
                    <Typography variant="body1" color="text.secondary" paragraph>
                        Select an approved credit application to start a new project.
                    </Typography>
                    <Paper sx={{ p: 4, mb: 2 }}>
                        <CreditApprovalSelector
                            approvals={approvals}
                            onSelect={handleSelectApproval}
                        />
                    </Paper>
                </>
            ) : (
                <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
                    <Typography variant="h5" gutterBottom>Confirm Customer Details</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Please review the customer details from the credit application before proceeding.
                    </Typography>

                    <Box sx={{ my: 3, p: 2, bgcolor: 'background.default', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" color="text.secondary">Customer Name</Typography>
                                <Typography variant="body1" fontWeight="medium">{selectedApproval.customer_name}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                                <Typography variant="body1">{selectedApproval.customer_email}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="subtitle2" color="text.secondary">Installation Address</Typography>
                                <Typography variant="body1">{selectedApproval.customer_address}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" color="text.secondary">Approved Amount</Typography>
                                <Typography variant="body1" fontWeight="bold">${selectedApproval.approved_amount.toLocaleString()}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="subtitle2" color="text.secondary">Customer Status</Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    {selectedApproval.match_status === 'Existing' ? (
                                        <Chip label="Existing Customer Account" color="primary" variant="outlined" />
                                    ) : (
                                        <Chip label="Will Create New Customer" color="success" variant="outlined" />
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    {selectedApproval.match_status === 'Existing' ? (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            This project will be linked to the existing customer account found for <strong>{selectedApproval.customer_email}</strong>.
                        </Alert>
                    ) : (
                        <Alert severity="success" sx={{ mb: 3 }}>
                            A new customer account will be created for <strong>{selectedApproval.customer_name}</strong>.
                        </Alert>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button onClick={() => setSelectedApproval(null)} disabled={loading}>
                            Back to List
                        </Button>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleConfirmCreate}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Create Project'}
                        </Button>
                    </Box>
                </Paper>
            )}
        </Box>
    );
};

export default NewProjectWizard;
