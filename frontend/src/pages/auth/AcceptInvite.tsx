import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, Container, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import * as invitationService from '../../services/invitationService';
import type { Invitation } from '../../types';

const AcceptInvite: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [invitation, setInvitation] = useState<Invitation | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Missing invitation token.");
            setLoading(false);
            return;
        }

        const validate = async () => {
            try {
                const inv = await invitationService.validateInvitation(token);
                if (inv) {
                    setInvitation(inv);
                } else {
                    setError("This invitation is invalid or has expired.");
                }
            } catch (err) {
                console.error("Validation error", err);
                setError("Failed to validate invitation.");
            } finally {
                setLoading(false);
            }
        };
        validate();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !name || !password) return;

        setSubmitting(true);
        try {
            await invitationService.acceptInvitation(token, { name, password });
            navigate('/'); // Redirect to dashboard after successful account creation
        } catch (err: any) {
            console.error("Accept error", err);
            setError(err.message || "Failed to create account.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !invitation) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Alert severity="error">{error || "Invitation not found."}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Card>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" gutterBottom align="center">
                        Accept Invitation
                    </Typography>
                    <Typography variant="body1" align="center" sx={{ mb: 3 }}>
                        You have been invited to join <strong>{invitation.organization_id}</strong> (lookup name later).
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
                        Create your account to get started.
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Email"
                            value={invitation.email}
                            fullWidth
                            disabled
                            margin="normal"
                        />
                        <TextField
                            label="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            required
                            margin="normal"
                            autoFocus
                        />
                        <TextField
                            label="Create Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            fullWidth
                            required
                            margin="normal"
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 3 }}
                            disabled={submitting}
                        >
                            {submitting ? 'Creating Account...' : 'Create Account & Join'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </Container>
    );
};

export default AcceptInvite;
