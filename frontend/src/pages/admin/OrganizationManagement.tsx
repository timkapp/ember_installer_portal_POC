import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Card, CardContent,
    Table, TableBody, TableCell, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, CircularProgress, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useAuth } from '../../contexts/AuthContext';
import * as adminConfigService from '../../services/adminConfigService';
import * as invitationService from '../../services/invitationService';
import type { InstallerOrganization, InstallerAccount, Invitation } from '../../types';

interface OrganizationWithDetails extends InstallerOrganization {
    users: InstallerAccount[];
    invitations: Invitation[];
}

const OrganizationManagement: React.FC = () => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create Org State
    const [createOrgOpen, setCreateOrgOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');

    // Invite User State
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
    const [inviteLoading, setInviteLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const orgs = await adminConfigService.getOrganizations();
            const orgsWithDetails = await Promise.all(orgs.map(async (org) => {
                const [users, invitations] = await Promise.all([
                    adminConfigService.getUsersByOrganization(org.id),
                    adminConfigService.getInvitationsByOrganization(org.id)
                ]);
                return { ...org, users, invitations };
            }));
            setOrganizations(orgsWithDetails);
        } catch (err) {
            console.error("Failed to load organizations", err);
            setError("Failed to load organizations.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrg = async () => {
        if (!newOrgName.trim()) return;
        try {
            await adminConfigService.createOrganization(newOrgName);
            setCreateOrgOpen(false);
            setNewOrgName('');
            loadData(); // Reload
        } catch (err) {
            console.error("Failed to create org", err);
            setError("Failed to create organization.");
        }
    };

    const openInviteDialog = (orgId: string) => {
        setSelectedOrgId(orgId);
        setInviteEmail('');
        setInviteLoading(false); // Reset loading state
        setInviteOpen(true);
    };

    const handleSendInvite = async () => {
        if (!selectedOrgId || !inviteEmail.trim()) {
            console.warn("Missing org ID or email");
            return;
        }

        setInviteLoading(true);
        try {
            // Ideally we get admin ID from auth context
            const adminId = user?.uid || 'mock-admin-id'; // Fallback for POC if not logged in
            console.log("Sending invite from:", adminId);
            const token = await invitationService.createInvitation(selectedOrgId, inviteEmail, adminId);
            console.log("Invitation Token Generated:", token); // For POC demo
            alert(`Invitation sent! Token (POC Only): ${token}`);
            setInviteOpen(false);
            loadData();
        } catch (err) {
            console.error("Failed to send invite", err);
            setError("Failed to send invitation.");
        } finally {
            setInviteLoading(false);
        }
    };

    if (loading) return <CircularProgress sx={{ m: 4 }} />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Organization Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOrgOpen(true)}>
                    New Organization
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {organizations.map(org => (
                <Card key={org.id} sx={{ mb: 3 }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">{org.name}</Typography>
                            <Button
                                variant="outlined"
                                startIcon={<PersonAddIcon />}
                                size="small"
                                onClick={() => openInviteDialog(org.id)}
                            >
                                Invite User
                            </Button>
                        </Box>

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Users</Typography>
                        <Table size="small" sx={{ mb: 2 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {org.users.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} align="center">No active users.</TableCell></TableRow>
                                ) : (
                                    org.users.map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell>{u.name}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>{u.status}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Pending Invitations</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Sent At</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {org.invitations.filter(i => !i.accepted_at).length === 0 ? (
                                    <TableRow><TableCell colSpan={3} align="center">No pending invitations.</TableCell></TableRow>
                                ) : (
                                    org.invitations.filter(i => !i.accepted_at).map(inv => (
                                        <TableRow key={inv.id}>
                                            <TableCell>{inv.email}</TableCell>
                                            <TableCell>{inv.created_at instanceof Date ? inv.created_at.toLocaleDateString() : 'Just now'}</TableCell>
                                            <TableCell>Pending</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}

            {/* Create Org Dialog */}
            <Dialog open={createOrgOpen} onClose={() => setCreateOrgOpen(false)}>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Organization Name"
                        fullWidth
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOrgOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateOrg} variant="contained">Create</Button>
                </DialogActions>
            </Dialog>

            {/* Invite User Dialog */}
            <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}>
                <DialogTitle>Invite User</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
                    <Button type="button" onClick={handleSendInvite} variant="contained" disabled={inviteLoading}>
                        {inviteLoading ? 'Sending...' : 'Send Invite'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OrganizationManagement;
