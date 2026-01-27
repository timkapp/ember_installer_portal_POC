import React, { useState } from 'react';
import { Box, Typography, Button, Paper, Grid, TextField } from '@mui/material';
import { evaluateProject, type EvaluationContext } from '../../lib/evaluationEngine';

const MOCK_STAGES: any[] = [
    { id: 'stage_1', name: 'Site Survey', activation_rules: {} },
    { id: 'stage_2', name: 'Permitting', activation_rules: { required_section_id: 'sec_1' } }
];

const MOCK_SECTIONS: any[] = [
    { id: 'sec_1', required_question_ids: ['q1'] }
];

const MOCK_QUESTIONS: any[] = [
    { id: 'q1', conditional_rule: null }
];

const EvaluationDebugger: React.FC = () => {
    const [jsonInput, setJsonInput] = useState<string>(JSON.stringify({
        project: { id: 'p1' },
        customer: {},
        credit_approval: { status: 'approved' },
        stages: MOCK_STAGES,
        sections: MOCK_SECTIONS,
        questions: MOCK_QUESTIONS,
        submissions: []
    }, null, 2));

    const [output, setOutput] = useState<any>(null);

    const handleRun = () => {
        try {
            const context = JSON.parse(jsonInput) as EvaluationContext;
            const result = evaluateProject(context);
            setOutput(result);
        } catch (e: any) {
            setOutput({ error: 'Evaluation Failed', details: e.message || e });
        }
    };

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>State Engine Debugger</Typography>
            <Typography gutterBottom>Simulate project state transitions.</Typography>

            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Input Context (JSON)</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={20}
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            sx={{ fontFamily: 'monospace' }}
                        />
                        <Box sx={{ mt: 2 }}>
                            <Button variant="contained" onClick={handleRun}>Run Evaluation</Button>
                        </Box>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper sx={{ p: 2, height: '100%', bgcolor: 'grey.100', overflow: 'auto' }}>
                        <Typography variant="h6">Derived State</Typography>
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                            {output ? JSON.stringify(output, null, 2) : 'Run evaluation to see results.'}
                        </pre>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EvaluationDebugger;
