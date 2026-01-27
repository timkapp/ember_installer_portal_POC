import React, { useState, useEffect } from 'react';
import { Box, Drawer, TextField, Button, Typography, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Chip, Switch, FormControlLabel } from '@mui/material';
import { type Section, type Question } from '../../../types';

interface SectionDrawerProps {
    open: boolean;
    onClose: () => void;
    section: Partial<Section>;
    availableSections: Section[];
    availableQuestions: Question[];
    onSave: (section: Section) => void;
}

const SectionDrawer: React.FC<SectionDrawerProps> = ({ open, onClose, section, availableSections, availableQuestions, onSave }) => {
    const [localSection, setLocalSection] = useState<Partial<Section>>(section);

    useEffect(() => {
        setLocalSection(section);
    }, [section, open]);

    const handleSaveClick = () => {
        if (!localSection.name) return;
        onSave(localSection as Section);
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 400, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">{localSection.id ? 'Edit Section' : 'New Section'}</Typography>

                <TextField
                    label="Name"
                    fullWidth
                    value={localSection.name || ''}
                    onChange={(e) => setLocalSection({ ...localSection, name: e.target.value })}
                />

                <TextField
                    label="Description"
                    fullWidth
                    multiline
                    rows={2}
                    value={localSection.description || ''}
                    onChange={(e) => setLocalSection({ ...localSection, description: e.target.value })}
                />

                <FormControl fullWidth>
                    <InputLabel>Prerequisite Sections</InputLabel>
                    <Select
                        multiple
                        value={localSection.depends_on_section_ids || []}
                        onChange={(e) => setLocalSection({ ...localSection, depends_on_section_ids: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                        input={<OutlinedInput label="Prerequisite Sections" />}
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => (
                                    <Chip key={value} label={availableSections.find(s => s.id === value)?.name || value} size="small" />
                                ))}
                            </Box>
                        )}
                    >
                        {availableSections
                            .filter(s => s.id !== localSection.id) // Avoid self-dependency
                            .map((s) => (
                                <MenuItem key={s.id} value={s.id}>
                                    {s.name}
                                </MenuItem>
                            ))}
                    </Select>
                </FormControl>

                <Box sx={{ mt: 2, borderTop: '1px solid #eee', pt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Visibility Logic</Typography>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={!!localSection.conditional_question_rule}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setLocalSection({
                                            ...localSection,
                                            conditional_question_rule: {
                                                question_id: '',
                                                operator: 'equals',
                                                value: ''
                                            }
                                        });
                                    } else {
                                        setLocalSection({ ...localSection, conditional_question_rule: undefined });
                                    }
                                }}
                            />
                        }
                        label="Conditional on Question Answer"
                    />

                    {localSection.conditional_question_rule && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, pl: 2, borderLeft: '2px solid #eee' }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Question</InputLabel>
                                <Select
                                    value={localSection.conditional_question_rule.question_id}
                                    label="Question"
                                    onChange={(e) => setLocalSection({
                                        ...localSection,
                                        conditional_question_rule: { ...localSection.conditional_question_rule!, question_id: e.target.value }
                                    })}
                                >
                                    {availableQuestions.map((q) => (
                                        <MenuItem key={q.id} value={q.id}>
                                            {q.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl fullWidth size="small">
                                <InputLabel>Operator</InputLabel>
                                <Select
                                    value={localSection.conditional_question_rule.operator}
                                    label="Operator"
                                    onChange={(e) => setLocalSection({
                                        ...localSection,
                                        conditional_question_rule: { ...localSection.conditional_question_rule!, operator: e.target.value as any }
                                    })}
                                >
                                    <MenuItem value="equals">Equals</MenuItem>
                                    <MenuItem value="not_equals">Not Equals</MenuItem>
                                    <MenuItem value="greater_than">Greater Than</MenuItem>
                                    <MenuItem value="less_than">Less Than</MenuItem>
                                    <MenuItem value="true">Is True</MenuItem>
                                    <MenuItem value="false">Is False</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                label="Value"
                                size="small"
                                fullWidth
                                value={localSection.conditional_question_rule.value}
                                onChange={(e) => setLocalSection({
                                    ...localSection,
                                    conditional_question_rule: { ...localSection.conditional_question_rule!, value: e.target.value }
                                })}
                            />
                        </Box>
                    )}
                </Box>

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={handleSaveClick} fullWidth>Save</Button>
                    <Button variant="outlined" onClick={onClose} fullWidth>Cancel</Button>
                </Box>
            </Box>
        </Drawer>
    );
};

export default SectionDrawer;
