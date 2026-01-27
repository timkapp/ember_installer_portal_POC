import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Accordion, AccordionSummary, AccordionDetails,
    Table, TableBody, TableCell, TableHead, TableRow, IconButton, Chip, Card, CardContent, Divider, MenuItem, TextField, Collapse
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { type Section, type Question, type Stage } from '../../types';
import SectionDrawer from './drawers/SectionDrawer';
import QuestionDrawer from './drawers/QuestionDrawer';
import StageDrawer from './drawers/StageDrawer';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DependencyWarningDialog from '../../components/common/DependencyWarningDialog';

import * as adminConfigService from '../../services/adminConfigService';

const DataCollectionConfig: React.FC = () => {
    const [stages, setStages] = useState<Stage[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    // Drawers State
    const [stageDrawerOpen, setStageDrawerOpen] = useState(false);
    const [currentStage, setCurrentStage] = useState<Partial<Stage>>({});

    const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState<Partial<Section>>({});
    const [activeStageIdForSection, setActiveStageIdForSection] = useState<string | null>(null);

    const [questionDrawerOpen, setQuestionDrawerOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> & { isRequired?: boolean }>({});
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    // Delete/Warning State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [warningOpen, setWarningOpen] = useState(false);
    const [warningData, setWarningData] = useState<{ title: string, message: string, items: string[] }>({ title: '', message: '', items: [] });
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'stage' | 'section' | 'question', item: Stage | Section | Question } | null>(null);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [loadedStages, loadedSections, loadedQuestions] = await Promise.all([
                    adminConfigService.getStages(),
                    adminConfigService.getSections(),
                    adminConfigService.getQuestions()
                ]);
                setStages(loadedStages);
                setSections(loadedSections);
                setQuestions(loadedQuestions);
            } catch (error) {
                console.error("Failed to load config:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // --- Stage Handlers ---
    const handleAddStage = () => {
        setCurrentStage({ stage_type: 'reentrant', activation_rules: {}, section_ids: [] });
        setStageDrawerOpen(true);
    };

    const handleEditStage = (stage: Stage, e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentStage({ ...stage });
        setStageDrawerOpen(true);
    };

    const handleDeleteStageClick = (stage: Stage, e: React.MouseEvent) => {
        e.stopPropagation();
        // Check for dependencies (maybe other stages depend on this one)
        const dependentStages = stages.filter(s => s.activation_rules?.required_stage_ids?.includes(stage.id));
        if (dependentStages.length > 0) {
            setWarningData({
                title: 'Cannot Delete Stage',
                message: `This stage cannot be deleted because the following stages depend on it:`,
                items: dependentStages.map(s => s.name)
            });
            setWarningOpen(true);
            return;
        }
        setDeleteTarget({ type: 'stage', item: stage });
        setConfirmOpen(true);
    };

    const handleSaveStage = async (stage: Stage) => {
        const stageToSave = { ...stage, id: stage.id || Date.now().toString() };

        // Optimistic Update
        if (stage.id) {
            setStages(prev => prev.map(s => s.id === stage.id ? stageToSave : s));
        } else {
            setStages(prev => [...prev, stageToSave]);
        }
        setStageDrawerOpen(false);

        try {
            await adminConfigService.saveStage(stageToSave);
        } catch (error) {
            console.error("Failed to save stage:", error);
        }
    };

    // --- Section Handlers ---
    const handleAddSection = (stageId?: string) => {
        setActiveStageIdForSection(stageId || null);
        setCurrentSection({ required_question_ids: [], optional_question_ids: [] });
        setSectionDrawerOpen(true);
    };

    const handleEditSection = (section: Section, e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentSection({ ...section });
        setSectionDrawerOpen(true);
    };

    const handleDeleteSectionClick = (section: Section, e: React.MouseEvent) => {
        e.stopPropagation();
        // Check dependencies
        const dependentSections = sections.filter(s => s.depends_on_section_ids?.includes(section.id));
        if (dependentSections.length > 0) {
            setWarningData({
                title: 'Cannot Delete Section',
                message: `This section cannot be deleted because the following sections depend on it:`,
                items: dependentSections.map(s => s.name)
            });
            setWarningOpen(true);
            return;
        }
        setDeleteTarget({ type: 'section', item: section });
        setConfirmOpen(true);
    };

    const handleSaveSection = async (section: Section) => {
        const sectionToSave = { ...section, id: section.id || Date.now().toString() };

        // Optimistic Update Section
        let newSections = [...sections];
        if (section.id) {
            newSections = sections.map(s => s.id === section.id ? sectionToSave : s);
        } else {
            newSections = [...sections, sectionToSave];
        }
        setSections(newSections);
        setSectionDrawerOpen(false);

        // If we are in "Add Section to Stage" mode, we need to update the Stage too
        let stageToUpdate: Stage | undefined;
        if (activeStageIdForSection && !section.id) { // Only assign on creation to avoid duplicates/moves complexity for now
            const parentStage = stages.find(s => s.id === activeStageIdForSection);
            if (parentStage) {
                stageToUpdate = {
                    ...parentStage,
                    section_ids: [...(parentStage.section_ids || []), sectionToSave.id]
                };
                setStages(prev => prev.map(s => s.id === parentStage.id ? stageToUpdate! : s));
            }
        }

        try {
            await adminConfigService.saveSection(sectionToSave);
            if (stageToUpdate) {
                await adminConfigService.saveStage(stageToUpdate);
            }
        } catch (error) {
            console.error("Failed to save section:", error);
        }
    };

    // --- Question Handlers ---
    const handleAddQuestion = (sectionId: string) => {
        setActiveSectionId(sectionId);
        setCurrentQuestion({ question_type: 'text', requires_approval: false, isRequired: true });
        setQuestionDrawerOpen(true);
    };

    const handleEditQuestion = (question: Question) => {
        const parentSection = sections.find(s =>
            s.required_question_ids.includes(question.id) ||
            s.optional_question_ids.includes(question.id)
        );
        const isRequired = parentSection ? parentSection.required_question_ids.includes(question.id) : false;

        setActiveSectionId(parentSection ? parentSection.id : null);
        setCurrentQuestion({ ...question, isRequired });
        setQuestionDrawerOpen(true);
    };

    const handleDeleteQuestionClick = (question: Question) => {
        const dependentQuestions = questions.filter(q => q.conditional_rule?.field === question.id);
        const dependentSections = sections.filter(s => s.conditional_question_rule?.question_id === question.id);

        if (dependentQuestions.length > 0 || dependentSections.length > 0) {
            setWarningData({
                title: 'Cannot Delete Question',
                message: `This question cannot be deleted because it is used in logic for:`,
                items: [...dependentQuestions.map(q => `Question: ${q.label}`), ...dependentSections.map(s => `Section: ${s.name}`)]
            });
            setWarningOpen(true);
            return;
        }
        setDeleteTarget({ type: 'question', item: question });
        setConfirmOpen(true);
    };

    const handleSaveQuestion = async (question: Question, isRequired: boolean) => {
        let savedQ = { ...question };
        if (!savedQ.id) savedQ.id = Date.now().toString();

        setQuestions(prev => {
            const exists = prev.find(q => q.id === savedQ.id);
            return exists ? prev.map(q => q.id === savedQ.id ? savedQ : q) : [...prev, savedQ];
        });

        let sectionToUpdate: Section | undefined;
        if (activeSectionId) {
            const s = sections.find(sec => sec.id === activeSectionId);
            if (s) {
                const newRequired = s.required_question_ids.filter(id => id !== savedQ.id);
                const newOptional = s.optional_question_ids.filter(id => id !== savedQ.id);
                sectionToUpdate = isRequired ?
                    { ...s, required_question_ids: [...newRequired, savedQ.id], optional_question_ids: newOptional } :
                    { ...s, required_question_ids: newRequired, optional_question_ids: [...newOptional, savedQ.id] };

                setSections(prev => prev.map(sec => sec.id === s.id ? sectionToUpdate! : sec));
            }
        }
        setQuestionDrawerOpen(false);

        try {
            await adminConfigService.saveQuestion(savedQ);
            if (sectionToUpdate) await adminConfigService.saveSection(sectionToUpdate);
        } catch (error) {
            console.error("Failed to save question:", error);
        }
    };

    // --- Deletion Confirmation ---
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            if (deleteTarget.type === 'stage') {
                const s = deleteTarget.item as Stage;
                setStages(prev => prev.filter(st => st.id !== s.id));
                await adminConfigService.deleteStage(s.id);
            } else if (deleteTarget.type === 'section') {
                const s = deleteTarget.item as Section;
                setSections(prev => prev.filter(sec => sec.id !== s.id));
                // We should also remove it from any stages that reference it
                const parentStage = stages.find(st => st.section_ids.includes(s.id));
                if (parentStage) {
                    const updatedStage = { ...parentStage, section_ids: parentStage.section_ids.filter(id => id !== s.id) };
                    setStages(prev => prev.map(st => st.id === parentStage.id ? updatedStage : st));
                    await adminConfigService.saveStage(updatedStage);
                }
                await adminConfigService.deleteSection(s.id);
            } else {
                const q = deleteTarget.item as Question;
                setQuestions(prev => prev.filter(qu => qu.id !== q.id));
                // Remove from section logic would be complex here, assuming optimistic for now is enough as per previous file
                await adminConfigService.deleteQuestion(q.id);
            }
        } catch (e) {
            console.error("Delete failed", e);
        }
        setConfirmOpen(false);
        setDeleteTarget(null);
    };

    // --- Helpers ---
    const getQuestionsForSection = (section: Section) => {
        const ids = [...section.required_question_ids, ...section.optional_question_ids];
        return questions.filter(q => ids.includes(q.id));
    };

    const getSectionsForStage = (stage: Stage) => {
        return sections.filter(s => stage.section_ids?.includes(s.id));
    };

    const handleMoveSection = async (sectionId: string, targetStageId: string) => {
        const targetStage = stages.find(s => s.id === targetStageId);
        if (!targetStage) return;

        const updatedStage = {
            ...targetStage,
            section_ids: [...(targetStage.section_ids || []), sectionId]
        };

        // Optimistic
        setStages(prev => prev.map(s => s.id === updatedStage.id ? updatedStage : s));

        try {
            await adminConfigService.saveStage(updatedStage);
        } catch (e) {
            console.error("Failed to move section", e);
        }
    };

    const getOrphanedSections = () => {
        const assignedIds = stages.flatMap(s => s.section_ids || []);
        return sections.filter(s => !assignedIds.includes(s.id));
    };

    if (loading) return <Box sx={{ p: 4 }}><Typography>Loading...</Typography></Box>;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Workflow Configuration</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddStage}>
                    Add New Stage
                </Button>
            </Box>

            {stages.map((stage) => (
                <Accordion key={stage.id} defaultExpanded sx={{ mb: 2, border: '1px solid #e0e0e0', '&:before': { display: 'none' } }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ mr: 1 }} />}
                        sx={{
                            bgcolor: 'action.hover',
                            flexDirection: 'row-reverse',
                            '& .MuiAccordionSummary-expandIconWrapper': {
                                transform: 'rotate(-90deg)',
                            },
                            '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
                                transform: 'rotate(0deg)',
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{stage.name}</Typography>
                            {stage.status === 'draft' && <Chip label="Draft" size="small" sx={{ ml: 2, bgcolor: 'text.disabled', color: 'white' }} />}
                            <Chip label={stage.stage_type === 'terminal' ? 'Once' : 'Multiple'} size="small" sx={{ ml: 2 }} />
                            {stage.activation_rules?.required_stage_ids?.length > 0 &&
                                <Chip label={`Depends on ${stage.activation_rules.required_stage_ids.length} stage(s)`} size="small" color="warning" variant="outlined" sx={{ ml: 1 }} />
                            }
                            <Box sx={{ flexGrow: 1 }} />
                            <IconButton size="small" onClick={(e) => handleEditStage(stage, e)}><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={(e) => handleDeleteStageClick(stage, e)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{stage.description || "No description provided."}</Typography>

                        <Box sx={{ pl: 2, borderLeft: '3px solid #eee' }}>
                            {getSectionsForStage(stage).map(section => {
                                const isExpanded = expandedSections[section.id] !== false; // Default expanded
                                return (
                                    <Card key={section.id} variant="outlined" sx={{ mb: 2 }}>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: '#fafafa', cursor: 'pointer' }}
                                            onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isExpanded }))}
                                        >
                                            <IconButton size="small" sx={{ mr: 1 }}>
                                                <ExpandMoreIcon sx={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
                                            </IconButton>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>{section.name}</Typography>
                                            {section.status === 'draft' && <Chip label="Draft" size="small" sx={{ ml: 1, bgcolor: 'text.disabled', color: 'white' }} />}
                                            <Box sx={{ flexGrow: 1 }} />
                                            <IconButton size="small" onClick={(e) => handleEditSection(section, e)}><EditIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" onClick={(e) => handleDeleteSectionClick(section, e)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                                        </div>
                                        <Collapse in={isExpanded}>
                                            <Divider />
                                            <CardContent>
                                                <Table size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell>Question</TableCell>
                                                            <TableCell>Type</TableCell>
                                                            <TableCell>Requirement</TableCell>
                                                            <TableCell align="right">Actions</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {getQuestionsForSection(section).length === 0 ? (
                                                            <TableRow><TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>No questions.</TableCell></TableRow>
                                                        ) : (
                                                            getQuestionsForSection(section).map(q => (
                                                                <TableRow key={q.id}>
                                                                    <TableCell>{q.label}</TableCell>
                                                                    <TableCell><Chip label={q.question_type} size="small" /></TableCell>
                                                                    <TableCell>
                                                                        {section.required_question_ids.includes(q.id) ?
                                                                            <Chip label="Required" size="small" color="primary" variant="outlined" /> :
                                                                            <Chip label="Optional" size="small" variant="outlined" />
                                                                        }
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        <IconButton size="small" onClick={() => handleEditQuestion(q)}><EditIcon fontSize="small" /></IconButton>
                                                                        <IconButton size="small" onClick={() => handleDeleteQuestionClick(q)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        )}
                                                    </TableBody>
                                                </Table>
                                                <Button startIcon={<AddIcon />} size="small" sx={{ mt: 1 }} onClick={() => handleAddQuestion(section.id)}>Add Question</Button>
                                            </CardContent>
                                        </Collapse>
                                    </Card>
                                );
                            })}
                            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleAddSection(stage.id)}>Add Section to Stage</Button>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            ))}

            {getOrphanedSections().length > 0 && (
                <Box sx={{ mt: 5, opacity: 0.8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningAmberIcon /> Unassigned Sections
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>These sections are not assigned to any stage.</Typography>
                    {getOrphanedSections().map(section => (
                        <Card key={section.id} variant="outlined" sx={{ mb: 2, borderStyle: 'dashed' }}>
                            <div style={{ display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: '#fff3e0' }}>
                                <Typography variant="subtitle1">{section.name}</Typography>
                                {section.status === 'draft' && <Chip label="Draft" size="small" sx={{ ml: 1, bgcolor: 'text.disabled', color: 'white' }} />}
                                <Box sx={{ flexGrow: 1 }} />
                                <IconButton size="small" onClick={(e) => handleEditSection(section, e)}><EditIcon fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={(e) => handleDeleteSectionClick(section, e)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                            </div>
                            <Box sx={{ px: 2, pt: 2 }}>
                                <TextField
                                    select
                                    label="Move to Stage"
                                    size="small"
                                    fullWidth
                                    value=""
                                    onChange={(e) => handleMoveSection(section.id, e.target.value)}
                                >
                                    <MenuItem value="" disabled>Select Stage...</MenuItem>
                                    {stages.map(s => (
                                        <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Box>
                            <CardContent>
                                <Typography variant="caption" color="text.secondary">Questions: {getQuestionsForSection(section).length}</Typography>
                                <Button size="small" sx={{ display: 'block', mt: 1 }} onClick={() => handleAddQuestion(section.id)}>Manage Questions</Button>
                            </CardContent>
                        </Card>
                    ))}

                </Box>
            )}

            {/* Drawers */}
            <StageDrawer
                open={stageDrawerOpen}
                onClose={() => setStageDrawerOpen(false)}
                stage={currentStage}
                stages={stages}
                onSave={handleSaveStage}
            />
            <SectionDrawer
                open={sectionDrawerOpen}
                onClose={() => setSectionDrawerOpen(false)}
                section={currentSection}
                availableSections={sections}
                availableQuestions={questions}
                onSave={handleSaveSection}
            />
            <QuestionDrawer
                open={questionDrawerOpen}
                onClose={() => setQuestionDrawerOpen(false)}
                question={currentQuestion}
                availableQuestions={questions}
                onSave={handleSaveQuestion}
            />

            <ConfirmDialog
                open={confirmOpen}
                title={`Delete ${deleteTarget?.type}`}
                message="Are you sure? This cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />

            <DependencyWarningDialog
                open={warningOpen}
                title={warningData.title}
                message={warningData.message}
                blockingItems={warningData.items}
                onClose={() => setWarningOpen(false)}
            />
        </Box>
    );
};

export default DataCollectionConfig;
