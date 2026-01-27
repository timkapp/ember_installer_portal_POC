import { type Project, type Customer, type Stage, type Section, type Question, type Submission, type RequiredAction, type CreditApproval } from '../types';

export interface EvaluationResult {
    active_stages: string[];
    completed_sections: string[];
    visible_questions: string[];
    required_actions: RequiredAction[];
    is_eligible: boolean;
}

export interface EvaluationContext {
    project: Project;
    customer: Customer;
    credit_approval: CreditApproval;
    stages: Stage[];
    sections: Section[];
    questions: Question[];
    submissions: Submission[];
}

/**
 * C.9 Evaluation Algorithm
 * Deterministically derives the state of a project.
 */
export const evaluateProject = (ctx: EvaluationContext): EvaluationResult => {
    const { project, customer, credit_approval, stages, sections, questions, submissions } = ctx;

    // 1. Eligibility Check (C.2.1)
    if (credit_approval.status !== 'approved') {
        return {
            active_stages: [],
            completed_sections: [],
            visible_questions: [],
            required_actions: [],
            is_eligible: false
        };
    }

    // Helper: Get Canonical Value
    const getCanonicalValue = (field: string): any => {
        // Simple mapping for POC
        if (field.startsWith('project.')) return (project as any)[field.replace('project.', '')];
        if (field.startsWith('customer.')) return (customer as any)[field.replace('customer.', '')];
        if (field.startsWith('submission.')) {
            // Find submission for potential field? Complex. 
            // For now, let's assume we look up answers in a map.
            return null;
        }
        return null;
    };

    // Helper: Check Rule
    const checkRule = (rule: any): boolean => {
        if (!rule) return true;
        const value = getCanonicalValue(rule.field);
        // Basic operators
        switch (rule.operator) {
            case 'equals': return value == rule.value;
            case 'not_equals': return value != rule.value;
            case 'greater_than': return value > rule.value;
            case 'less_than': return value < rule.value;
            case 'true': return value === true;
            case 'false': return value === false;
            default: return false;
        }
    };

    // 2. Evaluate Question Visibility (C.5)
    const visibleQuestions = questions.filter(q => {
        if (!q.conditional_rule) return true;
        return checkRule(q.conditional_rule);
    }).map(q => q.id);

    // 3. Evaluate Section Completion (C.6)
    const completedSections: string[] = [];

    sections.forEach(section => {
        // A section is complete if all REQUIRED, VISIBLE questions have VALID, APPROVED answers.
        const requiredVisibleQs = section.required_question_ids.filter(qid => visibleQuestions.includes(qid));

        const isComplete = requiredVisibleQs.every(qid => {
            const submission = submissions.find(s => s.question_id === qid);
            if (!submission) return false;

            // Check state
            if (submission.state === 'rejected') return false;
            // If requires approval, must be approved
            const questionDef = questions.find(q => q.id === qid);
            if (questionDef?.requires_approval && submission.state !== 'approved') return false;

            return submission.state !== 'empty';
        });

        if (isComplete) {
            completedSections.push(section.id);
        }
    });

    // 4. Evaluate Stage Activation (C.7)
    // For POC, simplify: All stages are active? Or stages depend on sections?
    // "Each Stage defines its own activation_rules" (C.7.1)
    // Let's assume stages are active if their previous stage is done OR no rules.
    const activeStages: string[] = [];
    stages.forEach(stage => {
        // Mock Rule: Active if "system_size > 0" or always active?
        // Let's rely on config. For POC, let's say "Site Survey" is active if "General Info" section is complete.
        // We need a way to define this in our mock data.

        // SIMPLE LOGIC FOR POC:
        // If stage has no rules, it's active.
        // If stage rules require a section, check it.
        // Rule: Active if NO rules, OR if ALL required sections are complete.
        if (!stage.activation_rules || Object.keys(stage.activation_rules).length === 0) {
            activeStages.push(stage.id);
        } else {
            // Check required_section_ids (Array)
            const requiredSectionIds = stage.activation_rules['required_section_ids'];

            // Backward compatibility for POC (remove if no longer needed, but safer to keep for now)
            const legacyRequiredId = stage.activation_rules['required_section_id'];

            let rulesMet = true;

            if (Array.isArray(requiredSectionIds) && requiredSectionIds.length > 0) {
                const allSectionsDone = requiredSectionIds.every(id => completedSections.includes(id));
                if (!allSectionsDone) rulesMet = false;
            } else if (legacyRequiredId) {
                if (!completedSections.includes(legacyRequiredId)) rulesMet = false;
            } else {
                // Rules existing but empty requirements? Treat as active (default fallthrough is true)
            }

            if (rulesMet) {
                activeStages.push(stage.id);
            }
        }
    });

    // 5. Derive Required Actions (C.8)
    const requiredActions: RequiredAction[] = [];

    // For every active stage... (actually actions are usually tied to Sections in that stage, or questions)
    // "RequiredActions are generated when: Required questions are missing..."

    // Iterate all visible questions in active scopes (assuming all sections belong to a stage?)
    // For POC: Iterate all sections. If a section is incomplete, generate actions for missing Qs.

    sections.forEach(section => {
        // If section is NOT complete, find out why
        if (!completedSections.includes(section.id)) {
            const requiredVisibleQs = section.required_question_ids.filter(qid => visibleQuestions.includes(qid));
            requiredVisibleQs.forEach(qid => {
                const submission = submissions.find(s => s.question_id === qid);
                if (!submission || submission.state === 'empty') {
                    requiredActions.push({
                        project_id: project.id,
                        question_id: qid,
                        reason: 'missing',
                        stage_context: 'derived' // would map to stage
                    });
                } else if (submission.state === 'rejected') {
                    requiredActions.push({
                        project_id: project.id,
                        question_id: qid,
                        reason: 'rejected',
                        stage_context: 'derived'
                    });
                } else if (submission.state === 'submitted') {
                    // Not an action for installer, but maybe for admin?
                    // Spec says "Required questions are awaiting approval". 
                    // Usually that blocks the process, does it generate an action for the Installer? No, for Admin.
                    // But "RequiredActions" implies Installer Actions in this context?
                    // C.8 says "RequiredActions are: Question-level... Not persisted".
                    // Let's create an action "awaiting_approval" so UI can show "Pending".
                    requiredActions.push({
                        project_id: project.id,
                        question_id: qid,
                        reason: 'awaiting_approval',
                        stage_context: 'derived'
                    });
                }
            });
        }
    });

    return {
        active_stages: activeStages,
        completed_sections: completedSections,
        visible_questions: visibleQuestions,
        required_actions: requiredActions,
        is_eligible: true
    };
};
