import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, Accordion, AccordionSummary, AccordionDetails,
    Table, TableBody, TableCell, TableHead, TableRow, IconButton, Chip, Card, CardContent, Divider, MenuItem, TextField, Collapse
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { type Section, type Question, type Stage } from '../../types';
import SectionDrawer from './drawers/SectionDrawer';
import QuestionDrawer from './drawers/QuestionDrawer';
import StageDrawer from './drawers/StageDrawer';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DependencyWarningDialog from '../../components/common/DependencyWarningDialog';

import * as adminConfigService from '../../services/adminConfigService';

// --- Sortable Components ---

// --- Sortable Components with Render Props for Handles ---

const SortableStageWithHandle = ({ stage, children }: { stage: Stage, children: (listeners: any) => React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    // Only apply ref and attributes to the container. Pass listeners to child.
    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {children(listeners)}
        </div>
    );
};

const SortableSectionWithHandle = ({ sectionId, children }: { sectionId: string, children: (listeners: any) => React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: sectionId });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {children(listeners)}
        </div>
    );
};

const SortableQuestionRowWithHandle = ({ id, children }: { id: string, children: (listeners: any) => React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <TableRow ref={setNodeRef} style={style} {...attributes}>
            {children(listeners)}
        </TableRow>
    );
};

// Drag Handle Component for cleaner UI
const DragHandle = ({ listeners }: { listeners?: any }) => (
    <IconButton size="small" sx={{ cursor: 'grab', mr: 1, p: 0.5 }} {...listeners}>
        <DragIndicatorIcon fontSize="small" color="action" />
    </IconButton>
);

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

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            // Determine what type of item we are dragging based on ID prefix or context?
            // Since we might have ID collisions if using raw UUIDs, assuming raw UUIDs are unique enough globally.
            // But we need to know WHICH list we are in.
            // Actually, handleDragEnd is global to the DndContext. We might need multiple Contexts or smart logic.
            // To simplify, let's look up the ID in our state lists.

            // 1. Stage Reordering
            const activeStageIndex = stages.findIndex(s => s.id === active.id);
            const overStageIndex = stages.findIndex(s => s.id === over?.id);
            if (activeStageIndex !== -1 && overStageIndex !== -1) {
                setStages((items) => {
                    const newItems = arrayMove(items, activeStageIndex, overStageIndex);
                    // Update order fields
                    const updatedItems = newItems.map((stage, index) => ({ ...stage, order: index }));
                    // Persist (Batch update ideal, but here simplistic)
                    updatedItems.forEach(s => adminConfigService.saveStage(s));
                    return updatedItems;
                });
                return;
            }

            // 2. Section Reordering (Within a Stage)
            // We need to find the Stage that contains these sections.
            // Assuming dragging only happens within the same container due to SortableContext constraints (if we separate them).
            // But handleDragEnd receives everything.
            // Find parent stage for active section
            const parentStage = stages.find(s => s.section_ids?.includes(active.id as string));
            if (parentStage && parentStage.section_ids?.includes(over?.id as string)) {
                // Reordering sections within this stage
                const oldIndex = parentStage.section_ids.indexOf(active.id as string);
                const newIndex = parentStage.section_ids.indexOf(over?.id as string);
                if (oldIndex !== -1 && newIndex !== -1) {
                    const newSectionIds = arrayMove(parentStage.section_ids, oldIndex, newIndex);
                    const updatedStage = { ...parentStage, section_ids: newSectionIds };
                    setStages(prev => prev.map(s => s.id === updatedStage.id ? updatedStage : s));
                    adminConfigService.saveStage(updatedStage);
                }
                return;
            }

            // 3. Question Reordering (Within a Section)
            // Need to find parent section
            // Helper: build question order if missing
            const getQuestionOrder = (sec: Section) =>
                sec.question_order || [...sec.required_question_ids, ...sec.optional_question_ids];

            const parentSection = sections.find(s => getQuestionOrder(s).includes(active.id as string));
            if (parentSection) {
                const currentOrder = getQuestionOrder(parentSection);
                if (currentOrder.includes(over?.id as string)) {
                    const oldIndex = currentOrder.indexOf(active.id as string);
                    const newIndex = currentOrder.indexOf(over?.id as string);
                    const newOrder = arrayMove(currentOrder, oldIndex, newIndex);

                    const updatedSection = { ...parentSection, question_order: newOrder };
                    setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s));
                    adminConfigService.saveSection(updatedSection);
                }
            }
        }
    };

    // Load Data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [loadedStages, loadedSections, loadedQuestions] = await Promise.all([
                    adminConfigService.getStages(),
                    adminConfigService.getSections(),
                    adminConfigService.getQuestions()
                ]);
                // Sort stages by order
                const sortedStages = loadedStages.sort((a, b) => (a.order || 0) - (b.order || 0));
                setStages(sortedStages);
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
        setCurrentStage({ stage_type: 'reentrant', activation_rules: {}, section_ids: [], isVisibleToInstaller: false });
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

                // Add to order if not present
                const currentOrder = s.question_order || [...s.required_question_ids, ...s.optional_question_ids];
                const newOrder = currentOrder.includes(savedQ.id) ? currentOrder : [...currentOrder, savedQ.id];

                sectionToUpdate = isRequired ?
                    { ...s, required_question_ids: [...newRequired, savedQ.id], optional_question_ids: newOptional, question_order: newOrder } :
                    { ...s, required_question_ids: newRequired, optional_question_ids: [...newOptional, savedQ.id], question_order: newOrder };

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
                // Remove from section logic
                // Should remove from question_order as well ideally, but lazy clean up happens on load or save
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
        const order = section.question_order || [...section.required_question_ids, ...section.optional_question_ids];
        return order
            .map(id => questions.find(q => q.id === id))
            .filter((q): q is Question => !!q);
    };

    const getSectionsForStage = (stage: Stage) => {
        if (!stage.section_ids) return [];
        return stage.section_ids
            .map(id => sections.find(s => s.id === id))
            .filter((s): s is Section => !!s);
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



            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    {stages.map((stage) => {
                        // Pass handle listeners to a specific drag handle
                        // SortableStageItem provides the attributes/listeners to the root div, 
                        // but we want drag handle ONLY on the handle icon to avoid conflict with Accordion toggle.
                        // So we need to modify SortableStageItem to assume we pass listeners manually?
                        // Or simpler: put the handle inside and use `useSortable` manually here?
                        // The `SortableStageItem` as defined wraps content in a div with `{...attributes} {...listeners}`.
                        // This makes the WHOLE div draggable. This conflicts with Accordion expansion click.
                        // We need a version where we separate the handle.
                        // Let's inline the useSortable logic for fine control or update the component.
                        // Updating component inline above is hard with `multi_replace`. 
                        // I will redefine SortableStageItem below to accept a 'handle' prop or render props? No, simpler to just inline logic or accept that I need to edit the separate definitions.
                        // Actually, I defined `SortableStageItem` earlier. Let's assume I can't easily change it now without another tool call.
                        // Wait, I can just use `useSortable` hook right here inside a component... but I can't put hooks inside a loop easily without sub-components.
                        // Let's use the `SortableStageItem` I defined, but I realized I made the whole div draggable.
                        // FIX: I will re-define `SortableStageItem` inside this replacement block to capture the `listeners` and pass them to a handle, 
                        // OR I will simply accept the whole row is draggable for now? No, that breaks accordion.
                        // Better: Use `dragHandle` option in `useSortable`? No, that's complex.
                        // Standard pattern: The `listeners` object from `useSortable` goes on the handle element.

                        return (
                            <SortableStageWithHandle key={stage.id} stage={stage}>
                                {(dragHandleProps) => (
                                    <Accordion defaultExpanded sx={{ mb: 2, border: '1px solid #e0e0e0', '&:before': { display: 'none' } }}>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon sx={{ mr: 1 }} />}
                                            sx={{
                                                bgcolor: 'action.hover',
                                                flexDirection: 'row-reverse',
                                                '& .MuiAccordionSummary-expandIconWrapper': { transform: 'rotate(-90deg)' },
                                                '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': { transform: 'rotate(0deg)' },
                                                '& .MuiAccordionSummary-content': { alignItems: 'center' }
                                            }}
                                        >
                                            <DragHandle listeners={dragHandleProps} />
                                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{stage.name}</Typography>
                                                {stage.status === 'draft' && <Chip label="Draft" size="small" sx={{ ml: 2, bgcolor: 'text.disabled', color: 'white' }} />}
                                                {!stage.isVisibleToInstaller && <Chip label="Hidden from Installer" size="small" sx={{ ml: 2, bgcolor: 'grey.300', color: 'grey.800' }} />}
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
                                                <SortableContext items={getSectionsForStage(stage).map(s => s.id)} strategy={verticalListSortingStrategy}>
                                                    {getSectionsForStage(stage).map(section => {
                                                        const isExpanded = expandedSections[section.id] !== false;
                                                        return (
                                                            <SortableSectionWithHandle key={section.id} sectionId={section.id}>
                                                                {(sectionHandleProps) => (
                                                                    <Card variant="outlined" sx={{ mb: 2 }}>
                                                                        <div
                                                                            style={{ display: 'flex', alignItems: 'center', padding: '16px', backgroundColor: '#fafafa', cursor: 'pointer' }}
                                                                            onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !isExpanded }))}
                                                                        >
                                                                            <DragHandle listeners={sectionHandleProps} />
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
                                                                                            <TableCell width={50}></TableCell>
                                                                                            <TableCell>Question</TableCell>
                                                                                            <TableCell>Type</TableCell>
                                                                                            <TableCell>Requirement</TableCell>
                                                                                            <TableCell align="right">Actions</TableCell>
                                                                                        </TableRow>
                                                                                    </TableHead>
                                                                                    <SortableContext items={getQuestionsForSection(section).map(q => q.id)} strategy={verticalListSortingStrategy}>
                                                                                        <TableBody>
                                                                                            {getQuestionsForSection(section).length === 0 ? (
                                                                                                <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>No questions.</TableCell></TableRow>
                                                                                            ) : (
                                                                                                getQuestionsForSection(section).map(q => (
                                                                                                    <SortableQuestionRowWithHandle key={q.id} id={q.id}>
                                                                                                        {(qHandleProps) => (
                                                                                                            <>
                                                                                                                <TableCell><DragHandle listeners={qHandleProps} /></TableCell>
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
                                                                                                            </>
                                                                                                        )}
                                                                                                    </SortableQuestionRowWithHandle>
                                                                                                ))
                                                                                            )}
                                                                                        </TableBody>
                                                                                    </SortableContext>
                                                                                </Table>
                                                                                <Button startIcon={<AddIcon />} size="small" sx={{ mt: 1 }} onClick={() => handleAddQuestion(section.id)}>Add Question</Button>
                                                                            </CardContent>
                                                                        </Collapse>
                                                                    </Card>
                                                                )}
                                                            </SortableSectionWithHandle>
                                                        );
                                                    })}
                                                </SortableContext>
                                                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => handleAddSection(stage.id)}>Add Section to Stage</Button>
                                            </Box>
                                        </AccordionDetails>
                                    </Accordion>
                                )}
                            </SortableStageWithHandle>
                        )
                    })}
                </SortableContext>

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
            </DndContext>

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
        </Box >
    );
};

export default DataCollectionConfig;
