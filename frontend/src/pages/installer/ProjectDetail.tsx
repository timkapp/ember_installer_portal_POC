import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Grid, TextField, Button, Accordion, AccordionSummary, AccordionDetails, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getProject, getProjectSections, submitSection } from '../../lib/projectService';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

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

    const handleInputChange = (questionId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmitSection = async (sectionId: string) => {
        if (!id) return;
        setSubmitting(true);
        try {
            // Filter data for this section
            // In a real app we'd validate required fields here based on Config
            // const section = sections.find(s => s.id === sectionId);

            await submitSection(id, sectionId, formData);
            alert('Section Submitted Successfully');
        } catch (e) {
            alert('Error submitting section');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (!project) return <Typography>Project not found</Typography>;

    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4">{project.customer_name}</Typography>
                <Typography color="text.secondary">{project.address} | ID: {project.id}</Typography>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" component="span" sx={{ bgcolor: 'secondary.light', px: 1, borderRadius: 1 }}>
                        {project.stage}
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Typography variant="h5" gutterBottom>Submissions</Typography>

            {sections.map((section) => (
                <Accordion key={section.id} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="h6">{section.name}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box component="form" noValidate autoComplete="off">
                            <Grid container spacing={3}>
                                {section.questions.map((q: any) => (
                                    <Grid size={{ xs: 12, md: 6 }} key={q.id}>
                                        {q.question_type === 'text' || q.question_type === 'number' ? (
                                            <TextField
                                                fullWidth
                                                label={q.label}
                                                type={q.question_type}
                                                value={formData[q.id] || ''}
                                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                            />
                                        ) : q.question_type === 'file_upload' ? (
                                            <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center' }}>
                                                <Typography variant="body2" gutterBottom>{q.label}</Typography>
                                                <Button variant="outlined" component="label">
                                                    Upload File
                                                    <input type="file" hidden />
                                                </Button>
                                            </Box>
                                        ) : (
                                            <TextField fullWidth label={q.label} disabled value="Unsupported Type" />
                                        )}
                                    </Grid>
                                ))}
                            </Grid>

                            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="contained"
                                    onClick={() => handleSubmitSection(section.id)}
                                    disabled={submitting}
                                >
                                    Submit Section
                                </Button>
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
};

export default ProjectDetail;
