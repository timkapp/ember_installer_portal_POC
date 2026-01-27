import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, TextField, Button, Accordion, AccordionSummary, AccordionDetails, Divider, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getProject, getProjectSections, reviewSubmission } from '../../lib/projectService';

const ReviewProject: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Review State
    const [reviewDialog, setReviewDialog] = useState<{ open: boolean, sectionId: string, action: 'approved' | 'rejected' }>({ open: false, sectionId: '', action: 'approved' });
    const [reason, setReason] = useState('');

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            try {
                const [proj, secs] = await Promise.all([
                    getProject(id),
                    getProjectSections(id)
                ]);
                setProject(proj);
                setSections(secs);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleOpenReview = (sectionId: string, action: 'approved' | 'rejected') => {
        setReviewDialog({ open: true, sectionId, action });
        setReason('');
    };

    const handleSubmitReview = async () => {
        if (!id) return;
        try {
            await reviewSubmission(id, reviewDialog.sectionId, reviewDialog.action, reason);
            alert(`Section ${reviewDialog.action.toUpperCase()}`);
            setReviewDialog({ ...reviewDialog, open: false });
        } catch (e) {
            alert('Error submitting review');
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (!project) return <Typography>Project not found</Typography>;

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4">{project.customer_name}</Typography>
                    <Typography color="text.secondary">Reviewing Pending Submission</Typography>
                </Box>
                <Button variant="outlined" onClick={() => navigate('/command-center')}>Back to Dashboard</Button>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {sections.map((section) => (
                <Accordion key={section.id} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Typography variant="h6">{section.name}</Typography>
                            <Chip label="Submitted" color="info" size="small" variant="outlined" />
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            {section.questions.map((q: any) => (
                                <Grid size={{ xs: 12, md: 6 }} key={q.id}>
                                    <TextField
                                        fullWidth
                                        label={q.label}
                                        value="Sample Answer" // Mock answer
                                        InputProps={{ readOnly: true }}
                                        variant="filled"
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        <Divider />

                        <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={() => handleOpenReview(section.id, 'rejected')}
                            >
                                Reject
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={() => handleOpenReview(section.id, 'approved')}
                            >
                                Approve
                            </Button>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            ))}

            {/* Review Dialog */}
            <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ ...reviewDialog, open: false })}>
                <DialogTitle>
                    {reviewDialog.action === 'approved' ? 'Approve Section' : 'Reject Section'}
                </DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>
                        Are you sure you want to {reviewDialog.action} this section?
                    </Typography>
                    {reviewDialog.action === 'rejected' && (
                        <TextField
                            autoFocus
                            margin="dense"
                            label="Rejection Reason"
                            fullWidth
                            multiline
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReviewDialog({ ...reviewDialog, open: false })}>Cancel</Button>
                    <Button onClick={handleSubmitReview} variant="contained" color={reviewDialog.action === 'approved' ? 'success' : 'error'}>
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReviewProject;
