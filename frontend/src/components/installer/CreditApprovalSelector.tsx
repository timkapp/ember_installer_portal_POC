import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { type CreditApproval } from '../../lib/projectService';

interface CreditApprovalSelectorProps {
    approvals: CreditApproval[];
    onSelect: (approval: CreditApproval) => void;
    selectedId?: string;
}

const CreditApprovalSelector: React.FC<CreditApprovalSelectorProps> = ({ approvals, onSelect, selectedId }) => {
    return (
        <Box>
            <Typography variant="h6" gutterBottom>Select an Approved Credit Application</Typography>
            <Grid container spacing={2}>
                {approvals.map((app) => (
                    <Grid size={{ xs: 12, md: 6 }} key={app.id}>
                        <Card
                            variant="outlined"
                            sx={{
                                borderColor: selectedId === app.id ? 'primary.main' : undefined,
                                borderWidth: selectedId === app.id ? 2 : 1,
                                cursor: 'pointer'
                            }}
                            onClick={() => onSelect(app)}
                        >
                            <CardContent>
                                <Typography variant="subtitle1" fontWeight="bold">{app.customer_name}</Typography>
                                <Typography variant="body2" color="text.secondary">{app.customer_address}</Typography>
                                <Typography variant="body2">{app.customer_email}</Typography>
                                <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ bgcolor: 'success.light', color: 'success.dark', px: 1, borderRadius: 1 }}>
                                        APPROVED
                                    </Typography>
                                    <Typography variant="h6">${app.approved_amount.toLocaleString()}</Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default CreditApprovalSelector;
