import React, { useState, useEffect } from 'react';
import { Box, Drawer, TextField, Button, MenuItem, FormControlLabel, Switch, Typography } from '@mui/material';
import { type Question, type QuestionType } from '../../../types';

// Extended interface for form state
interface QuestionFormState extends Partial<Question> {
    isRequired?: boolean;
}

interface QuestionDrawerProps {
    open: boolean;
    onClose: () => void;
    question: QuestionFormState;
    availableQuestions: Question[];
    onSave: (question: Question, isRequired: boolean) => void;
}

const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'file_upload', label: 'File Upload' },
    { value: 'select', label: 'Select' },
    { value: 'date', label: 'Date' }
];

const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'true', label: 'Is True' },
    { value: 'false', label: 'Is False' }
];

const QuestionDrawer: React.FC<QuestionDrawerProps> = ({ open, onClose, question, availableQuestions, onSave }) => {
    const [localQuestion, setLocalQuestion] = useState<QuestionFormState>(question);
    const [hasCondition, setHasCondition] = useState(false);

    useEffect(() => {
        setLocalQuestion(question);
        setHasCondition(!!question.conditional_rule);
    }, [question, open]);

    const handleSaveClick = () => {
        if (!localQuestion.label || !localQuestion.question_type) return;

        // Clean up condition if disabled
        const questionToSave = { ...localQuestion };
        if (!hasCondition) {
            delete questionToSave.conditional_rule;
        }

        // Separate isRequired from the question object before saving
        const { isRequired, ...finalQuestion } = questionToSave;

        onSave(finalQuestion as Question, !!isRequired);
    };

    return (
        <Drawer anchor="right" open={open} onClose={onClose}>
            <Box sx={{ width: 400, p: 3, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                <Typography variant="h6">{localQuestion.id ? 'Edit Question' : 'New Question'}</Typography>

                <TextField
                    label="Label"
                    fullWidth
                    value={localQuestion.label || ''}
                    onChange={(e) => setLocalQuestion({ ...localQuestion, label: e.target.value })}
                />

                <TextField
                    label="Instructions"
                    fullWidth
                    multiline
                    rows={2}
                    value={localQuestion.instructions || ''}
                    onChange={(e) => setLocalQuestion({ ...localQuestion, instructions: e.target.value })}
                />

                <TextField
                    select
                    label="Type"
                    fullWidth
                    value={localQuestion.question_type || 'text'}
                    onChange={(e) => {
                        const newType = e.target.value as QuestionType;
                        let newDataType = 'string';
                        if (newType === 'file_upload') newDataType = 'file';
                        if (newType === 'number') newDataType = 'number';
                        if (newType === 'boolean') newDataType = 'boolean';
                        if (newType === 'date') newDataType = 'date';

                        setLocalQuestion({
                            ...localQuestion,
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

                {localQuestion.question_type === 'file_upload' && (
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="subtitle2">File Upload Constraints</Typography>
                        <TextField
                            label="Allowed File Types"
                            placeholder=".pdf, .jpg, .png"
                            helperText="Comma separated list of extensions (e.g. .pdf, .jpg)"
                            fullWidth
                            size="small"
                            value={localQuestion.allowed_file_types?.join(', ') || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                const types = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
                                setLocalQuestion({
                                    ...localQuestion,
                                    allowed_file_types: types
                                });
                            }}
                        />
                        <TextField
                            label="Max File Size (MB)"
                            type="number"
                            size="small"
                            fullWidth
                            value={localQuestion.max_file_size_mb || ''}
                            onChange={(e) => setLocalQuestion({
                                ...localQuestion,
                                max_file_size_mb: Number(e.target.value)
                            })}
                        />
                    </Box>
                )}

                <TextField
                    label="Mapped Canonical Field"
                    fullWidth
                    helperText="e.g., customer.name"
                    value={localQuestion.mapped_field || ''}
                    onChange={(e) => setLocalQuestion({ ...localQuestion, mapped_field: e.target.value })}
                />

                <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Storage Type: <strong>{localQuestion.data_type || 'string'}</strong>
                    </Typography>
                </Box>

                <FormControlLabel
                    control={
                        <Switch
                            checked={localQuestion.isRequired || false}
                            onChange={(e) => setLocalQuestion({ ...localQuestion, isRequired: e.target.checked })}
                        />
                    }
                    label="Required Answer"
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={localQuestion.requires_approval || false}
                            onChange={(e) => setLocalQuestion({ ...localQuestion, requires_approval: e.target.checked })}
                        />
                    }
                    label="Requires Admin Approval"
                />

                <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2, mt: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={hasCondition}
                                onChange={(e) => setHasCondition(e.target.checked)}
                            />
                        }
                        label="Conditional Logic"
                    />

                    {hasCondition && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                            <TextField
                                select
                                label="Dependent Field"
                                size="small"
                                fullWidth
                                value={localQuestion.conditional_rule?.field || ''}
                                onChange={(e) => setLocalQuestion({
                                    ...localQuestion,
                                    conditional_rule: {
                                        ...(localQuestion.conditional_rule || { operator: 'equals', value: '' }),
                                        field: e.target.value
                                    } as any
                                })}
                                helperText="Select the question this depends on"
                            >
                                {availableQuestions
                                    .filter(q => q.id !== localQuestion.id)
                                    .map(q => (
                                        <MenuItem key={q.id} value={q.id}>{q.label}</MenuItem>
                                    ))
                                }
                            </TextField>
                            <TextField
                                select
                                label="Operator"
                                size="small"
                                fullWidth
                                value={localQuestion.conditional_rule?.operator || 'equals'}
                                onChange={(e) => setLocalQuestion({
                                    ...localQuestion,
                                    conditional_rule: {
                                        ...(localQuestion.conditional_rule || { field: '', value: '' }),
                                        operator: e.target.value as any
                                    }
                                })}
                            >
                                {operators.map((op) => (
                                    <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                label="Value"
                                size="small"
                                fullWidth
                                value={localQuestion.conditional_rule?.value || ''}
                                onChange={(e) => setLocalQuestion({
                                    ...localQuestion,
                                    conditional_rule: {
                                        ...(localQuestion.conditional_rule || { field: '', operator: 'equals' }),
                                        value: e.target.value
                                    } as any
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

export default QuestionDrawer;
