import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Grid, TextField, Button, Divider, MenuItem, Paper, List, ListItemButton, ListItemIcon, ListItemText, Snackbar, Alert, ListSubheader } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import LockIcon from '@mui/icons-material/Lock';
import { getProject, submitSection, getSubmissions } from '../../lib/projectService';

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<any>(null);
    const [sections, setSections] = useState<any[]>([]);
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [serverSubmissions, setServerSubmissions] = useState<any[]>([]); // New State
    const [submitting, setSubmitting] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    const loadProject = React.useCallback(async () => {
        if (!id) return;
        try {
            // Load Project (Mock)
            const proj = await getProject(id);
            setProject(proj);

            // Load Config dynamically
            const [allStages, allSections, existingSubmissions] = await Promise.all([
                import('../../services/adminConfigService').then(m => m.getStages()),
                import('../../services/adminConfigService').then(m => m.getSections()),
                getSubmissions(id)
            ]);

            setServerSubmissions(existingSubmissions);

            // Populate formData from submissions
            const initialData: Record<string, any> = {};
            existingSubmissions.forEach((sub: any) => {
                initialData[sub.question_id] = sub.value;
            });
            setFormData(initialData);

            const allQuestions = await import('../../services/adminConfigService').then(m => m.getQuestions());

            // 1. Identify ACTIVE STAGES
            // Use proj.active_stages if available, otherwise fallback to proj.stage
            let activeStageConfigs: any[] = [];

            if (proj.active_stages && proj.active_stages.length > 0) {
                activeStageConfigs = allStages.filter(s => proj.active_stages.includes(s.id));
                // Sort by order
                activeStageConfigs.sort((a, b) => (a.order || 0) - (b.order || 0));
            } else {
                // Fallback logic
                const visibleStages = allStages.filter(s => s.isVisibleToInstaller !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
                let activeStageConfig = allStages.find(s => s.name === proj.stage);
                if (!activeStageConfig && visibleStages.length > 0) activeStageConfig = visibleStages[0];
                if (activeStageConfig) activeStageConfigs = [activeStageConfig];
            }

            if (activeStageConfigs.length === 0) {
                setSections([]);
                return;
            }

            // 2. Collect Sections from ALL active stages
            // We need to know which stage a section belongs to for the UI grouping.
            // Let's create a flat list but attach stage info to the section object.

            const allHydratedSections: any[] = [];

            activeStageConfigs.forEach(stage => {
                const stageSectionIds = new Set(stage.section_ids || []);
                const stageSections = allSections.filter(sec => stageSectionIds.has(sec.id));

                const hydrated = stageSections.map(sec => {
                    const questionOrder = sec.question_order || [...sec.required_question_ids, ...sec.optional_question_ids];
                    const sectionQuestions = questionOrder.map(qId => allQuestions.find(q => q.id === qId)).filter(Boolean);
                    return {
                        ...sec,
                        questions: sectionQuestions,
                        stageName: stage.name, // Attach stage name for UI grouping
                        stageId: stage.id
                    };
                });
                allHydratedSections.push(...hydrated);
            });

            setSections(allHydratedSections);

            // Set default active section
            if (activeSectionId && !allHydratedSections.find(s => s.id === activeSectionId)) {
                if (allHydratedSections.length > 0) setActiveSectionId(allHydratedSections[0].id);
                else setActiveSectionId(null);
            } else if (!activeSectionId && allHydratedSections.length > 0) {
                setActiveSectionId(allHydratedSections[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadProject();
    }, [loadProject]);

    const activeSection = sections.find(s => s.id === activeSectionId);

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
            const result: any = await submitSection(id, sectionId, formData);

            // Reload to check for updates
            await loadProject();

            // 1. Did stage change? (Check result from backend if possible, or infer from reload)
            // Backend returns { stageComplete: boolean, newStages?: string[] }
            if (result && result.stageComplete && result.newStages) {
                // Convert IDs to Names if possible, or just say 'Project Updated'
                setSnackbar({
                    open: true,
                    message: `Stages Updated! Active Stages: ${result.newStages.length}`,
                    severity: 'success'
                });
                return;
            }
        } catch (e) {
            setSnackbar({
                open: true,
                message: 'Error submitting section. Please try again.',
                severity: 'error'
            });
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

            {/* Internal Dashboard Layout */}
            <Grid container spacing={4}>
                {/* Internal Sidebar - Sections Navigation */}
                <Grid size={{ xs: 12, md: 3 }}>
                    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                        <List component="nav" disablePadding>
                            <Box sx={{ p: 2, bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider' }}>
                                <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                                    STAGES
                                </Typography>
                            </Box>
                            {/* Group sections by Stage */}
                            {(() => {
                                // 1. Calculate Completion Status for ALL sections first
                                const completedSectionIds = new Set<string>();
                                sections.forEach(sec => {
                                    const isComplete = sec.questions.every((q: any) => {
                                        if (q.requires_approval) return true;
                                        return formData[q.id] && formData[q.id].toString().trim() !== '';
                                    });
                                    if (isComplete) completedSectionIds.add(sec.id);
                                });

                                // 2. Filter for Visibility
                                const visibleSections = sections.filter(sec => {
                                    if (!sec.depends_on_section_ids || sec.depends_on_section_ids.length === 0) return true;
                                    return sec.depends_on_section_ids.every((id: string) => completedSectionIds.has(id));
                                });

                                // 3. Group Visible Sections and Calculate Stage Status
                                const lockedStageIds = new Set<string>();
                                const activeStagesSet = new Set<string>();

                                // Group by Stage ID to keep it robust
                                const grouped = visibleSections.reduce((acc: any, sec: any) => {
                                    const stageId = sec.stageId || 'other';
                                    if (!acc[stageId]) {
                                        acc[stageId] = {
                                            name: sec.stageName || 'Other',
                                            sections: []
                                        };
                                        activeStagesSet.add(stageId);
                                    }
                                    acc[stageId].sections.push(sec);
                                    return acc;
                                }, {});

                                // Calculate Locked Stages (Server State Only)
                                // Only check stages that are currently active/visible in the UI list
                                activeStagesSet.forEach(stageId => {
                                    const stageSections = sections.filter(s => s.stageId === stageId);
                                    if (stageSections.length > 0) {
                                        const isLocked = stageSections.every(sec => {
                                            return sec.questions.every((q: any) => {
                                                if (q.requires_approval) {
                                                    const sub = serverSubmissions.find(s => s.question_id === q.id);
                                                    return sub && sub.state === 'approved';
                                                }
                                                const sub = serverSubmissions.find(s => s.question_id === q.id);
                                                return sub && (sub.value || sub.value === 0);
                                            });
                                        });
                                        if (isLocked) lockedStageIds.add(stageId);
                                    }
                                });

                                return Object.keys(grouped).map(stageId => {
                                    const group = grouped[stageId];
                                    const isLocked = lockedStageIds.has(stageId);

                                    return (
                                        <React.Fragment key={stageId}>
                                            <ListSubheader component="div" sx={{ fontWeight: 'bold', lineHeight: '32px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <span>{group.name}</span>
                                                {isLocked && <LockIcon fontSize="small" color="action" sx={{ mr: 1 }} />}
                                            </ListSubheader>
                                            {group.sections.map((section: any) => {
                                                const isComplete = completedSectionIds.has(section.id);
                                                const isActive = activeSectionId === section.id;
                                                // If stage is locked, section acts locked/complete
                                                // BUT "isComplete" here refers to client-side data (checkmarks). 
                                                // We keep that as is for feedback while typing.

                                                return (
                                                    <React.Fragment key={section.id}>
                                                        <ListItemButton
                                                            selected={isActive}
                                                            onClick={() => setActiveSectionId(section.id)}
                                                            sx={{
                                                                borderLeft: isActive ? 4 : 0,
                                                                borderColor: 'primary.main',
                                                                bgcolor: isActive ? 'action.selected' : 'transparent'
                                                            }}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: 40 }}>
                                                                {isComplete ? (
                                                                    <CheckCircleIcon color="success" />
                                                                ) : (
                                                                    <RadioButtonUncheckedIcon color="disabled" />
                                                                )}
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={section.name}
                                                                primaryTypographyProps={{
                                                                    fontWeight: isActive ? 'bold' : 'regular',
                                                                    color: isActive ? 'primary.main' : 'text.primary'
                                                                }}
                                                            />
                                                        </ListItemButton>
                                                        <Divider component="li" />
                                                    </React.Fragment>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                });
                            })()}
                        </List>
                    </Paper>
                </Grid>

                {/* Main Content Area - Active Section Form */}
                <Grid size={{ xs: 12, md: 9 }}>
                    {activeSection ? (
                        <Paper sx={{ p: 4 }} elevation={0} variant="outlined">
                            {/* Check if Locked */}
                            {(() => {
                                // Re-calculate completion for the Active Stage specifically.
                                let isStageLocked = false;
                                if (activeSection) {
                                    const stageSections = sections.filter(s => s.stageId === activeSection.stageId);
                                    // Check completion status using the SAME logic as sidebar
                                    const allComplete = stageSections.every(sec => {
                                        return sec.questions.every((q: any) => {
                                            if (q.requires_approval) {
                                                // Check for approved submission in server state
                                                const sub = serverSubmissions.find(s => s.question_id === q.id);
                                                return sub && sub.state === 'approved';
                                            }
                                            // Check for ANY submission for other types (server state)
                                            const sub = serverSubmissions.find(s => s.question_id === q.id);
                                            return sub && (sub.value || sub.value === 0);
                                        });
                                    });
                                    if (allComplete) isStageLocked = true;
                                }

                                return (
                                    <>
                                        <Box sx={{ mb: 3 }}>
                                            <Typography variant="h5" gutterBottom>{activeSection.name}</Typography>
                                            {isStageLocked ? (
                                                <Alert severity="info" sx={{ mb: 2 }}>
                                                    This stage is complete. Information is read-only.
                                                </Alert>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">
                                                    Please complete all required fields in this section.
                                                </Typography>
                                            )}
                                        </Box>

                                        <Box component="form" noValidate autoComplete="off">
                                            <Grid container spacing={3}>
                                                {activeSection.questions.map((q: any) => (
                                                    <Grid size={{ xs: 12, md: 6 }} key={q.id}>
                                                        {/* Input Field based on Type */}
                                                        {q.question_type === 'text' || q.question_type === 'number' ? (
                                                            <TextField
                                                                fullWidth
                                                                label={q.label}
                                                                type={q.question_type}
                                                                value={formData[q.id] || ''}
                                                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                                                disabled={isStageLocked}
                                                            />
                                                        ) : q.question_type === 'select' ? (
                                                            <TextField
                                                                select
                                                                fullWidth
                                                                label={q.label}
                                                                value={formData[q.id] || ''}
                                                                onChange={(e) => handleInputChange(q.id, e.target.value)}
                                                                disabled={isStageLocked}
                                                            >
                                                                {(q.options || []).map((opt: any) => (
                                                                    <MenuItem key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </MenuItem>
                                                                ))}
                                                            </TextField>
                                                        ) : q.question_type === 'file_upload' ? (
                                                            <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center', opacity: isStageLocked ? 0.6 : 1 }}>
                                                                <Typography variant="body2" gutterBottom>{q.label}</Typography>
                                                                <Button variant="outlined" component="label" disabled={isStageLocked}>
                                                                    Upload File
                                                                    <input type="file" hidden />
                                                                </Button>
                                                            </Box>
                                                        ) : (
                                                            <TextField fullWidth label={q.label} disabled value="Unsupported Type" />
                                                        )}

                                                        {/* Approval Status Indicator */}
                                                        {q.requires_approval && formData[q.id] && (
                                                            <Box sx={{ mt: 1 }}>
                                                                <Box sx={{
                                                                    display: 'inline-flex',
                                                                    bgcolor: 'warning.light',
                                                                    color: 'warning.dark',
                                                                    px: 1,
                                                                    py: 0.5,
                                                                    borderRadius: 1,
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    Waiting Approval
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </Grid>
                                                ))}
                                            </Grid>

                                            {!isStageLocked && (
                                                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <Button
                                                        variant="contained"
                                                        size="large"
                                                        onClick={() => handleSubmitSection(activeSection.id)}
                                                        disabled={submitting}
                                                    >
                                                        Save Section
                                                    </Button>
                                                </Box>
                                            )}
                                        </Box>
                                    </>
                                );
                            })()}
                        </Paper>
                    ) : (
                        <Paper sx={{ p: 4, textAlign: 'center' }} variant="outlined">
                            <Typography color="text.secondary">Select a section from the menu to get started.</Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProjectDetail;
