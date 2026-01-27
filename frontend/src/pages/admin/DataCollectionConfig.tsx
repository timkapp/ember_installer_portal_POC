import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Accordion, AccordionSummary, AccordionDetails,
    Table, TableBody, TableCell, TableHead, TableRow, IconButton, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { type Section, type Question } from '../../types';
import SectionDrawer from './drawers/SectionDrawer';
import QuestionDrawer from './drawers/QuestionDrawer';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DependencyWarningDialog from '../../components/common/DependencyWarningDialog';

import * as adminConfigService from '../../services/adminConfigService';

const DataCollectionConfig: React.FC = () => {
    const [sections, setSections] = useState<Section[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    const [sectionDrawerOpen, setSectionDrawerOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState<Partial<Section>>({});

    const [questionDrawerOpen, setQuestionDrawerOpen] = useState(false);
    // Extended state for drawer
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question> & { isRequired?: boolean }>({});
    const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

    // Delete Confirmation State
    // Delete Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [warningOpen, setWarningOpen] = useState(false);
    const [warningData, setWarningData] = useState<{ title: string, message: string, items: string[] }>({ title: '', message: '', items: [] });
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'section' | 'question', item: Section | Question } | null>(null);

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [loadedSections, loadedQuestions] = await Promise.all([
                    adminConfigService.getSections(),
                    adminConfigService.getQuestions()
                ]);
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

    // --- Section Handlers ---
    const handleAddSection = () => {
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

        // Check for dependencies
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

    const confirmDeleteSection = async (section: Section) => {
        // Optimistic Delete
        setSections(sections.filter(s => s.id !== section.id));

        try {
            await adminConfigService.deleteSection(section.id);
        } catch (error) {
            console.error("Failed to delete section:", error);
        }
    };

    const handleSaveSection = async (section: Section) => {
        const sectionToSave = { ...section, id: section.id || Date.now().toString() };

        // Optimistic Update
        if (section.id) {
            setSections(sections.map(s => s.id === section.id ? sectionToSave : s));
        } else {
            setSections([...sections, sectionToSave]);
        }

        setSectionDrawerOpen(false);

        // Persist
        try {
            await adminConfigService.saveSection(sectionToSave);
        } catch (error) {
            console.error("Failed to save section:", error);
            // Revert? For POC, just log for now.
        }
    };

    // --- Question Handlers ---
    const handleAddQuestion = (sectionId: string) => {
        setActiveSectionId(sectionId);
        setCurrentQuestion({ question_type: 'text', requires_approval: false, isRequired: true }); // Default to required
        setQuestionDrawerOpen(true);
    };

    const handleEditQuestion = (question: Question) => {
        // Find parent section to determine isRequired
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
        // Check for dependencies (conditional rules from other questions)
        const dependentQuestions = questions.filter(q => q.conditional_rule?.field === question.id);

        // Check for dependencies (conditional rules from sections)
        const dependentSections = sections.filter(s => s.conditional_question_rule?.question_id === question.id);

        if (dependentQuestions.length > 0 || dependentSections.length > 0) {
            const items = [
                ...dependentQuestions.map(q => `Question: ${q.label}`),
                ...dependentSections.map(s => `Section: ${s.name}`)
            ];

            setWarningData({
                title: 'Cannot Delete Question',
                message: `This question cannot be deleted because it is used in the conditional logic of the following items:`,
                items: items
            });
            setWarningOpen(true);
            return;
        }

        setDeleteTarget({ type: 'question', item: question });
        setConfirmOpen(true);
    };

    const confirmDeleteQuestion = async (question: Question) => {
        // Find parent section
        const parentSection = sections.find(s =>
            s.required_question_ids.includes(question.id) ||
            s.optional_question_ids.includes(question.id)
        );

        // Optimistic Delete Question
        setQuestions(questions.filter(q => q.id !== question.id));

        let sectionToUpdate: Section | undefined;

        // Optimistic Update Section
        if (parentSection) {
            setSections(prev => prev.map(s => {
                if (s.id === parentSection.id) {
                    const updated = {
                        ...s,
                        required_question_ids: s.required_question_ids.filter(id => id !== question.id),
                        optional_question_ids: s.optional_question_ids.filter(id => id !== question.id)
                    };
                    sectionToUpdate = updated;
                    return updated;
                }
                return s;
            }));
        }

        try {
            await adminConfigService.deleteQuestion(question.id);
            if (sectionToUpdate) {
                await adminConfigService.saveSection(sectionToUpdate);
            }
        } catch (error) {
            console.error("Failed to delete question:", error);
        }
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === 'section') {
            confirmDeleteSection(deleteTarget.item as Section);
        } else {
            confirmDeleteQuestion(deleteTarget.item as Question);
        }
        setConfirmOpen(false);
        setDeleteTarget(null);
    };

    const handleSaveQuestion = async (question: Question, isRequired: boolean) => {
        let savedQ = { ...question };
        let finalSectionId = activeSectionId;

        // 1. Save or Update the Question
        if (!savedQ.id) {
            savedQ.id = Date.now().toString();
        }

        // Optimistic update Questions
        setQuestions(prev => {
            const exists = prev.find(q => q.id === savedQ.id);
            if (exists) return prev.map(q => q.id === savedQ.id ? savedQ : q);
            return [...prev, savedQ];
        });

        // 2. Update Parent Section Lists (Required vs Optional)
        let sectionToUpdate: Section | undefined;

        if (finalSectionId) {
            setSections(prev => prev.map(s => {
                if (s.id === finalSectionId) {
                    // Remove from both lists first to avoid duplicates/confusion
                    const newRequired = s.required_question_ids.filter(id => id !== savedQ.id);
                    const newOptional = s.optional_question_ids.filter(id => id !== savedQ.id);

                    let updatedSection;
                    if (isRequired) {
                        updatedSection = { ...s, required_question_ids: [...newRequired, savedQ.id], optional_question_ids: newOptional };
                    } else {
                        updatedSection = { ...s, required_question_ids: newRequired, optional_question_ids: [...newOptional, savedQ.id] };
                    }
                    sectionToUpdate = updatedSection;
                    return updatedSection;
                }
                return s;
            }));
        }
        setQuestionDrawerOpen(false);

        // Persist
        try {
            await adminConfigService.saveQuestion(savedQ);
            if (sectionToUpdate) {
                await adminConfigService.saveSection(sectionToUpdate);
            }
        } catch (error) {
            console.error("Failed to save question/section:", error);
        }
    };

    const getQuestionsForSection = (section: Section) => {
        const ids = [...section.required_question_ids, ...section.optional_question_ids];
        return questions.filter(q => ids.includes(q.id));
    };

    if (loading) {
        return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading configuration...</Typography></Box>;
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Data Collection Config</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddSection}>
                    Add Section
                </Button>
            </Box>

            {sections.map((section) => (
                <Accordion key={section.id} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="h6">{section.name}</Typography>
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleEditSection(section, e)}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleDeleteSectionClick(section, e)}
                                    color="error"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Box>
                            <Box sx={{ flexGrow: 1, ml: 2 }}>
                                <Typography variant="caption" color="text.secondary">{section.description}</Typography>
                            </Box>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: 'background.paper' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                QUESTIONS
                            </Typography>
                            <Button size="small" startIcon={<AddIcon />} onClick={() => handleAddQuestion(section.id)}>
                                Add Question
                            </Button>
                        </Box>

                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Label</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Mapped Field</TableCell>
                                    <TableCell>Required?</TableCell>
                                    <TableCell>Approval?</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {getQuestionsForSection(section).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ fontStyle: 'italic', color: 'text.secondary', py: 3 }}>
                                            No questions in this section yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    getQuestionsForSection(section).map(q => (
                                        <TableRow key={q.id}>
                                            <TableCell>{q.label}</TableCell>
                                            <TableCell><Chip label={q.question_type} size="small" /></TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{q.mapped_field || '-'}</TableCell>
                                            <TableCell>
                                                {section.required_question_ids.includes(q.id) ?
                                                    <Chip label="Required" size="small" color="primary" variant="outlined" /> :
                                                    <Chip label="Optional" size="small" variant="outlined" />
                                                }
                                                {q.conditional_rule && <Chip label="Conditional" size="small" color="warning" sx={{ ml: 1 }} />}
                                            </TableCell>
                                            <TableCell>{q.requires_approval ? 'Yes' : 'No'}</TableCell>
                                            <TableCell align="right">
                                                <IconButton size="small" onClick={() => handleEditQuestion(q)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteQuestionClick(q)} color="error">
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </AccordionDetails>
                </Accordion>
            ))}

            {/* Drawers would be rendered here (passing state/handlers) */}
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
                title={deleteTarget?.type === 'section' ? 'Delete Section' : 'Delete Question'}
                message={`Are you sure you want to delete ${deleteTarget?.type === 'section' ? 'section' : 'question'} "${deleteTarget?.type === 'section' ? (deleteTarget.item as Section).name : (deleteTarget?.item as Question)?.label}"? This action cannot be undone.`}
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
