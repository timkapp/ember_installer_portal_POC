import React, { useState, useEffect } from 'react';
import { Box, Drawer, TextField, Button, Typography, MenuItem, Switch, FormControlLabel } from '@mui/material';
import type { Stage } from '../../../types';

interface StageDrawerProps {
    open: boolean;
    onClose: () => void;
    stage: Partial<Stage>;
    stages: Stage[]; // All stages (for prerequisites)

    onSave: (stage: Stage) => void;
}

const stageTypes = [
    { value: 'terminal', label: 'Allow Once' },
    { value: 'reentrant', label: 'Allow Multiple' }
];

const StageDrawer: React.FC<StageDrawerProps> = ({ open, onClose, stage, stages, onSave }) => {
    const [currentStage, setCurrentStage] = useState<Partial<Stage>>(stage);

    useEffect(() => {
        setCurrentStage(stage);
    }, [stage]);

    const handleSave = () => {
        if (!currentStage.name) return;
        onSave(currentStage as Stage);
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
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

                <FormControlLabel
                    control={
                        <Switch
                            checked={currentStage.status !== 'draft'}
                            onChange={(e) => setCurrentStage({ ...currentStage, status: e.target.checked ? 'active' : 'draft' })}
                            color="success"
                        />
                    }
                    label={currentStage.status === 'draft' ? "Status: Draft (Paused)" : "Status: Active (Live)"}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={!!currentStage.isVisibleToInstaller}
                            onChange={(e) => setCurrentStage({ ...currentStage, isVisibleToInstaller: e.target.checked })}
                            color="primary"
                        />
                    }
                    label={currentStage.isVisibleToInstaller ? "Visible to Installer: Yes" : "Visible to Installer: No (Hidden)"}
                />

                <TextField
                    select
                    label="Stage Type"
                    fullWidth
                    value={currentStage.stage_type || 'reentrant'}
                    onChange={(e) => {
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

                    <Box sx={{ mt: 3, p: 2, border: '1px dashed #ccc', borderRadius: 1, bgcolor: 'action.hover' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Advanced State Rules (Coming Soon)
                        </Typography>
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ mb: 1.5 }}>
                            Define complex activation rules based on Customer or Project state (e.g., Account 30 days overdue or System underperforming).
                        </Typography>
                        <TextField
                            label="Condition (e.g. project.status == 'active')"
                            fullWidth
                            disabled
                            size="small"
                            placeholder="Future capability..."
                        />
                    </Box>
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={handleSave} fullWidth>Save</Button>
                    <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default StageDrawer;
