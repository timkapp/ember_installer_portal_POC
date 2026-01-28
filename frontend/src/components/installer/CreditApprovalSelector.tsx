import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Chip, Button } from '@mui/material';
import { type CreditApproval } from '../../lib/projectService';

interface CreditApprovalSelectorProps {
    approvals: CreditApproval[];
    onSelect: (approval: CreditApproval) => void;
}

const CreditApprovalSelector: React.FC<CreditApprovalSelectorProps> = ({ approvals, onSelect }) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    // Filter and Sort
    const filteredApprovals = React.useMemo(() => {
        return approvals
            .filter(app => {
                const term = searchTerm.toLowerCase();
                return (
                    app.customer_name.toLowerCase().includes(term) ||
                    app.customer_email.toLowerCase().includes(term) ||
                    app.customer_address.toLowerCase().includes(term)
                );
            })
            .sort((a, b) => {
                // Default sort: new to old
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
    }, [approvals, searchTerm]);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Select an Approved Credit Application</Typography>
                <TextField
                    placeholder="Search by name, email, or address..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 300 }}
                />
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Approval Date</TableCell>
                            <TableCell>Customer Name</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell align="right">Approved Amount</TableCell>
                            <TableCell align="center">Customer Status</TableCell>
                            <TableCell align="center">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredApprovals.map((app) => (
                            <TableRow
                                key={app.id}
                                hover
                            >
                                <TableCell>
                                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    <Box>
                                        <Typography variant="subtitle2">{app.customer_name}</Typography>
                                        <Typography variant="caption" color="text.secondary">{app.customer_email}</Typography>
                                    </Box>
                                </TableCell>
                                <TableCell>{app.customer_address}</TableCell>
                                <TableCell align="right">
                                    <Typography fontWeight="bold">
                                        ${app.approved_amount.toLocaleString()}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    {app.match_status === 'Existing' ? (
                                        <Chip label="Existing Customer" color="primary" size="small" variant="outlined" />
                                    ) : (
                                        <Chip label="New Customer" color="success" size="small" variant="outlined" />
                                    )}
                                </TableCell>
                                <TableCell align="center">
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => onSelect(app)}
                                    >
                                        Start Project
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredApprovals.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    {searchTerm ? 'No matching approvals found.' : 'No approved credit applications available.'}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default CreditApprovalSelector;
