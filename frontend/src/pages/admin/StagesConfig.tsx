import React, { useState, useEffect } from 'react';
import { Box, Drawer, TextField, Button, Typography, MenuItem } from '@mui/material';
import ConfigTable from '../../components/admin/ConfigTable';
import { type Stage, type Section } from '../../types';
import * as adminConfigService from '../../services/adminConfigService';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const stageTypes = [
    { value: 'terminal', label: 'Allow Once' },
    { value: 'reentrant', label: 'Allow Multiple' }
];

const StagesConfig: React.FC = () => {
    const [stages, setStages] = useState<Stage[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentStage, setCurrentStage] = useState<Partial<Stage>>({});
    const [loading, setLoading] = useState(true);

    // Delete Confirmation State
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Stage | null>(null);

    useEffect(() => {
        const loadStages = async () => {
            try {
                const [stagesData, sectionsData] = await Promise.all([
                    adminConfigService.getStages(),
                    adminConfigService.getSections()
                ]);
                setStages(stagesData);
                setSections(sectionsData);
            } catch (error) {
                console.error("Failed to load stages:", error);
            } finally {
                setLoading(false);
            }
        };
        loadStages();
    }, []);

    const handleAdd = () => {
        setCurrentStage({ stage_type: 'reentrant', activation_rules: {}, section_ids: [] });
        setDrawerOpen(true);
    };

    const handleEdit = (stage: Stage) => {
        setCurrentStage({ ...stage });
        setDrawerOpen(true);
    };

    const handleDeleteClick = (stage: Stage) => {
        setDeleteTarget(stage);
        setConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        const stage = deleteTarget;

        // Optimistic delete
        setStages(stages.filter(s => s.id !== stage.id));
        setConfirmOpen(false);
        setDeleteTarget(null);

        try {
            await adminConfigService.deleteStage(stage.id);
        } catch (e) {
            console.error("Failed to delete stage:", e);
            // Revert?
        }
    };

    const handleSave = async () => {
        if (!currentStage.name) return;

        const stageToSave = { ...currentStage, id: currentStage.id || Date.now().toString() } as Stage;

        // Optimistic Save
        if (currentStage.id) {
            setStages(stages.map(s => s.id === currentStage.id ? stageToSave : s));
        } else {
            setStages([...stages, stageToSave]);
        }
        setDrawerOpen(false);

        // Persist
        try {
            await adminConfigService.saveStage(stageToSave);
        } catch (e) {
            console.error("Failed to save stage:", e);
        }
    };

    const columns = [
        { id: 'name', label: 'Name', minWidth: 200 },
        {
            id: 'stage_type',
            label: 'Type',
            minWidth: 120,
            format: (value: string) => value === 'terminal' ? 'Allow Once' : 'Allow Multiple'
        },
        {
            id: 'description',
            label: 'Description',
            minWidth: 200,
            format: (value: string | undefined) => (value && value.length > 50) ? value.substring(0, 50) + '...' : (value || '')
        },
    ];

    if (loading) {
        return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading stages...</Typography></Box>;
    }

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Configuration: Stages</Typography>
            <ConfigTable
                title="Stages"
                columns={columns}
                rows={stages}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
            />

            <ConfirmDialog
                open={confirmOpen}
                title="Delete Stage"
                message={`Are you sure you want to delete stage "${deleteTarget?.name}"? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />


            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <Box sx={{ width: 400, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6">{currentStage.id ? 'Edit Stage' : 'New Stage'}</Typography>

                    <TextField
                        label="Name"
                        fullWidth
                        value={currentStage.name || ''}
                        onChange={(e) => setCurrentStage({ ...currentStage, name: e.target.value })}
                    />

                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        rows={2}
                        value={currentStage.description || ''}
                        onChange={(e) => setCurrentStage({ ...currentStage, description: e.target.value })}
                    />

                    <TextField
                        select
                        label="Stage Type"
                        fullWidth
                        value={currentStage.stage_type || 'reentrant'}
                        onChange={(e) => {
                            // Cast the value to the specific union type
                            const val = e.target.value as 'terminal' | 'reentrant';
                            setCurrentStage({ ...currentStage, stage_type: val })
                        }}
                    >
                        {stageTypes.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        select
                        label="Assigned Sections"
                        fullWidth
                        SelectProps={{
                            multiple: true,
                            renderValue: (selected: any) => {
                                const selectedIds = selected as string[];
                                return (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selectedIds.map((id) => (
                                            <Box key={id} sx={{ bgcolor: 'primary.main', color: 'white', px: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                                                {sections.find(s => s.id === id)?.name || id}
                                            </Box>
                                        ))}
                                    </Box>
                                )
                            }
                        }}
                        value={currentStage.section_ids || []}
                        onChange={(e) => {
                            const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                            setCurrentStage({ ...currentStage, section_ids: val });
                        }}
                        helperText="Select the sections that belong to this stage."
                    >
                        {sections.map((s) => (
                            <MenuItem key={s.id} value={s.id}>
                                {s.name}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Rules Builder */}
                    <Box sx={{ border: '1px solid #eee', p: 2, borderRadius: 1, mt: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>Activation Rules</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Define when this stage becomes active.
                        </Typography>



                        <TextField
                            select
                            label="Prerequisite Stages"
                            fullWidth
                            sx={{ mt: 2 }}
                            SelectProps={{
                                multiple: true,
                                renderValue: (selected: any) => {
                                    const selectedIds = selected as string[];
                                    return (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selectedIds.map((id) => (
                                                <Box key={id} sx={{ bgcolor: 'warning.light', color: 'black', px: 1, borderRadius: 1, fontSize: '0.75rem' }}>
                                                    {stages.find(s => s.id === id)?.name || id}
                                                </Box>
                                            ))}
                                        </Box>
                                    )
                                }
                            }}
                            value={currentStage.activation_rules?.required_stage_ids || []}
                            onChange={(e) => {
                                const val = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                                setCurrentStage({
                                    ...currentStage,
                                    activation_rules: {
                                        ...currentStage.activation_rules,
                                        required_stage_ids: val
                                    }
                                });
                            }}
                        >
                            {stages
                                .filter(s => s.id !== currentStage.id) // Prevent self-dependency
                                .map((s) => (
                                    <MenuItem key={s.id} value={s.id}>
                                        {s.name}
                                    </MenuItem>
                                ))
                            }
                        </TextField>
                    </Box>

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button variant="contained" onClick={handleSave} fullWidth>Save</Button>
                        <Button variant="outlined" onClick={() => setDrawerOpen(false)} fullWidth>Cancel</Button>
                    </Box>
                </Box>
            </Drawer>
        </Box >
    );
};

export default StagesConfig;
