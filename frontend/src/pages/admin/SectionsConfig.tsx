import React, { useState } from 'react';
import { Box, Drawer, TextField, Button, Typography, Chip, FormControl, InputLabel, Select, MenuItem, OutlinedInput } from '@mui/material';
import ConfigTable from '../../components/admin/ConfigTable';
import { type Section } from '../../types';
import { validateSectionDependencies, validateSectionContent } from '../../utils/validators';
// Mock Questions for selection (ideally fetched) (We need this accessible for validation mock)
const availableQuestions = [
    { id: 'q1', label: 'Project Name', question_type: 'text' } as any,
    { id: 'q2', label: 'Utility Bill', question_type: 'file_upload' } as any,
    { id: 'q3', label: 'System Size', question_type: 'number' } as any
];

// Mock Data
const initialSections: Section[] = [
    {
        id: 's1',
        name: 'General Information',
        description: 'Basic project details',
        required_question_ids: ['q1'],
        optional_question_ids: []
    }
];

const SectionsConfig: React.FC = () => {
    const [sections, setSections] = useState<Section[]>(initialSections);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentSection, setCurrentSection] = useState<Partial<Section>>({});
    const [errors, setErrors] = useState<string[]>([]);

    const handleAdd = () => {
        setCurrentSection({ required_question_ids: [], optional_question_ids: [] });
        setErrors([]);
        setDrawerOpen(true);
    };

    const handleEdit = (section: Section) => {
        setCurrentSection({ ...section });
        setErrors([]);
        setDrawerOpen(true);
    };

    const handleDelete = (section: Section) => {
        if (window.confirm(`Are you sure you want to delete "${section.name}"?`)) {
            setSections(sections.filter(s => s.id !== section.id));
        }
    };

    const handleSave = () => {
        if (!currentSection.name) {
            setErrors(['Name is required']);
            return;
        }

        const sectionToSave = { ...currentSection, id: currentSection.id || Date.now().toString() } as Section;

        // Validation
        const depErrors = validateSectionDependencies(sectionToSave, sections);
        const contentErrors = validateSectionContent(sectionToSave, availableQuestions); // Mock passing all questions

        if (depErrors.length > 0 || contentErrors.length > 0) {
            setErrors([...depErrors, ...contentErrors]);
            return;
        }

        if (currentSection.id) {
            setSections(sections.map(s => s.id === currentSection.id ? sectionToSave : s));
        } else {
            setSections([...sections, sectionToSave]);
        }
        setDrawerOpen(false);
    };

    const columns = [
        { id: 'name', label: 'Name', minWidth: 200 },
        {
            id: 'required_question_ids',
            label: 'Required Qs',
            minWidth: 100,
            format: (value: string[]) => value.length.toString()
        },
        {
            id: 'optional_question_ids',
            label: 'Optional Qs',
            minWidth: 100,
            format: (value: string[]) => value.length.toString()
        },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Configuration: Sections</Typography>
            <ConfigTable
                title="Sections"
                columns={columns}
                rows={sections}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
            >
                <Box sx={{ width: 400, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6">{currentSection.id ? 'Edit Section' : 'New Section'}</Typography>

                    {errors.length > 0 && (
                        <Box sx={{ bgcolor: 'error.light', p: 1, borderRadius: 1 }}>
                            {errors.map((err, idx) => (
                                <Typography key={idx} variant="body2" color="error.dark">• {err}</Typography>
                            ))}
                        </Box>
                    )}

                    <TextField
                        label="Name"
                        fullWidth
                        value={currentSection.name || ''}
                        onChange={(e) => setCurrentSection({ ...currentSection, name: e.target.value })}
                    />

                    <TextField
                        label="Description"
                        fullWidth
                        multiline
                        rows={2}
                        value={currentSection.description || ''}
                        onChange={(e) => setCurrentSection({ ...currentSection, description: e.target.value })}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Required Questions</InputLabel>
                        <Select
                            multiple
                            value={currentSection.required_question_ids || []}
                            onChange={(e) => setCurrentSection({ ...currentSection, required_question_ids: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                            input={<OutlinedInput label="Required Questions" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip key={value} label={availableQuestions.find(q => q.id === value)?.label || value} size="small" />
                                    ))}
                                </Box>
                            )}
                        >
                            {availableQuestions.map((q) => (
                                <MenuItem key={q.id} value={q.id}>
                                    {q.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button variant="contained" onClick={handleSave} fullWidth>Save</Button>
                        <Button variant="outlined" onClick={() => setDrawerOpen(false)} fullWidth>Cancel</Button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};

export default SectionsConfig;
