import React, { useState, useEffect } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, Paper, TextField, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CreditApprovalSelector from '../../components/installer/CreditApprovalSelector';
import { getCreditApprovals, createProject, type CreditApproval } from '../../lib/projectService';

const steps = ['Select Credit Approval', 'Confirm Customer', 'Create Project'];

const NewProjectWizard: React.FC = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [approvals, setApprovals] = useState<CreditApproval[]>([]);
    const [selectedApproval, setSelectedApproval] = useState<CreditApproval | null>(null);
    const [customerData, setCustomerData] = useState<any>({});

    useEffect(() => {
        // Load approvals on mount
        const load = async () => {
            const data = await getCreditApprovals('org_1'); // Mock org ID
            setApprovals(data);
        };
        load();
    }, []);

    const handleNext = async () => {
        if (activeStep === 0 && !selectedApproval) {
            alert('Please select a credit approval');
            return;
        }

        if (activeStep === 0 && selectedApproval) {
            // populate customer data from approval
            setCustomerData({
                name: selectedApproval.customer_name,
                email: selectedApproval.customer_email,
                address: selectedApproval.customer_address,
                phone: '' // Missing in mock, installer adds it
            });
        }

        if (activeStep === steps.length - 1) {
            // Final step: Create
            if (!selectedApproval) return;
            setLoading(true);
            try {
                const projectId = await createProject(selectedApproval, customerData);
                // navigate to project (mock)
                alert(`Project Created: ${projectId}`);
                navigate('/projects');
            } catch (e) {
                console.error(e);
                alert('Failed to create project');
            } finally {
                setLoading(false);
            }
            return;
        }

        setActiveStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Typography variant="h4" gutterBottom>New Project</Typography>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Paper sx={{ p: 4, mb: 2 }}>
                {activeStep === 0 && (
                    <CreditApprovalSelector
                        approvals={approvals}
                        onSelect={setSelectedApproval}
                        selectedId={selectedApproval?.id}
                    />
                )}

                {activeStep === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="h6">Confirm Customer Details</Typography>
                        <TextField
                            label="Legal Name"
                            fullWidth
                            value={customerData.name}
                            disabled // Locked from Credit App
                            helperText="sourced from Credit Application"
                        />
                        <TextField
                            label="Email"
                            fullWidth
                            value={customerData.email}
                            disabled // Locked from Credit App
                        />
                        <TextField
                            label="Installation Address"
                            fullWidth
                            value={customerData.address}
                            disabled // Locked from Credit App
                        />
                        <TextField
                            label="Phone Number"
                            fullWidth
                            value={customerData.phone}
                            onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                        />
                    </Box>
                )}

                {activeStep === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Review & Create</Typography>
                        <Typography><strong>Customer:</strong> {customerData.name}</Typography>
                        <Typography><strong>Address:</strong> {customerData.address}</Typography>
                        <Typography><strong>Credit Approved:</strong> ${selectedApproval?.approved_amount.toLocaleString()}</Typography>

                        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                            <Typography variant="body2" color="info.contrastText">
                                Creating this project will initialize the lifecycle and secure the credit allocation.
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Paper>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button disabled={activeStep === 0 || loading} onClick={handleBack}>
                    Back
                </Button>
                <Button variant="contained" onClick={handleNext} disabled={loading}>
                    {activeStep === steps.length - 1 ? (loading ? <CircularProgress size={24} /> : 'Create Project') : 'Next'}
                </Button>
            </Box>
        </Box>
    );
};

export default NewProjectWizard;
