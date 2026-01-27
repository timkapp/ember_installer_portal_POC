import React, { useState } from 'react';
import { Box, Drawer, TextField, Button, MenuItem, FormControlLabel, Switch, Typography } from '@mui/material';
import ConfigTable from '../../components/admin/ConfigTable';
import { type Question, type QuestionType } from '../../types';

// Mock Data
const initialQuestions: Question[] = [
    {
        id: 'q1',
        label: 'Project Name',
        instructions: 'Enter the name of the project',
        question_type: 'text',
        data_type: 'string',
        mapped_field: 'project.name',
        requires_approval: false,
    },
    {
        id: 'q2',
        label: 'Utility Bill',
        instructions: 'Upload the latest utility bill',
        question_type: 'file_upload',
        data_type: 'file',
        mapped_field: 'customer.utility_bill',
        requires_approval: true,
        allowed_file_types: ['pdf', 'jpg'],
        max_file_size_mb: 10
    }
];

const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'file_upload', label: 'File Upload' },
    { value: 'select', label: 'Select' },
    { value: 'date', label: 'Date' }
];

const QuestionsConfig: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>(initialQuestions);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({});

    const handleAdd = () => {
        setCurrentQuestion({ question_type: 'text', requires_approval: false });
        setDrawerOpen(true);
    };

    const handleEdit = (question: Question) => {
        setCurrentQuestion({ ...question });
        setDrawerOpen(true);
    };

    const handleDelete = (question: Question) => {
        if (window.confirm(`Are you sure you want to delete "${question.label}"?`)) {
            setQuestions(questions.filter(q => q.id !== question.id));
        }
    };

    const handleSave = () => {
        if (!currentQuestion.label || !currentQuestion.question_type) return;

        if (currentQuestion.id) {
            // Edit
            setQuestions(questions.map(q => q.id === currentQuestion.id ? currentQuestion as Question : q));
        } else {
            // Add
            const newQuestion = { ...currentQuestion, id: Date.now().toString() } as Question;
            setQuestions([...questions, newQuestion]);
        }
        setDrawerOpen(false);
    };

    const columns = [
        { id: 'label', label: 'Label', minWidth: 170 },
        { id: 'question_type', label: 'Type', minWidth: 100 },
        {
            id: 'mapped_field',
            label: 'Mapped Field',
            minWidth: 170,
            format: (value: any) => value || '-'
        },
        {
            id: 'requires_approval',
            label: 'Approval?',
            minWidth: 100,
            format: (value: boolean) => value ? 'Yes' : 'No'
        },
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Configuration: Questions</Typography>
            <ConfigTable
                title="Questions"
                columns={columns}
                rows={questions}
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
                    <Typography variant="h6">{currentQuestion.id ? 'Edit Question' : 'New Question'}</Typography>

                    <TextField
                        label="Label"
                        fullWidth
                        value={currentQuestion.label || ''}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, label: e.target.value })}
                    />

                    <TextField
                        label="Instructions"
                        fullWidth
                        multiline
                        rows={2}
                        value={currentQuestion.instructions || ''}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, instructions: e.target.value })}
                    />

                    <TextField
                        select
                        label="Type"
                        fullWidth
                        value={currentQuestion.question_type || 'text'}
                        onChange={(e) => {
                            const newType = e.target.value as QuestionType;
                            let newDataType = 'string'; // Default
                            if (newType === 'file_upload') newDataType = 'file';
                            if (newType === 'number') newDataType = 'number';
                            if (newType === 'boolean') newDataType = 'boolean';
                            if (newType === 'date') newDataType = 'date';

                            setCurrentQuestion({
                                ...currentQuestion,
                                question_type: newType,
                                data_type: newDataType
                            });
                        }}
                    >
                        {questionTypes.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        label="Mapped Canonical Field"
                        fullWidth
                        helperText="e.g., customer.name or project.system_size"
                        value={currentQuestion.mapped_field || ''}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, mapped_field: e.target.value })}
                    />

                    {/* Data Type is now determined by Type automatically */}
                    <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Storage Type: <strong>{currentQuestion.data_type || 'string'}</strong>
                        </Typography>
                    </Box>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={currentQuestion.requires_approval || false}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, requires_approval: e.target.checked })}
                            />
                        }
                        label="Requires Approval"
                    />

                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button variant="contained" onClick={handleSave} fullWidth>Save</Button>
                        <Button variant="outlined" onClick={() => setDrawerOpen(false)} fullWidth>Cancel</Button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};

export default QuestionsConfig;
