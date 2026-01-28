import { type Project, type Customer, type Stage, type Section, type Question, type Submission, type RequiredAction, type CreditApproval } from '../types';

export interface EvaluationResult {
    active_stages: string[];
    completed_sections: string[];
    visible_questions: string[];
    visible_sections: string[]; // Added
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
            visible_sections: [],
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

    // 3. Evaluate Section Visibility & Completion (C.6)
    const completedSections: string[] = [];
    const visibleSectionIds: string[] = [];

    // Filter out draft sections first
    const activeSections = sections.filter(s => s.status !== 'draft');

    // We must evaluate section visibility iteratively or just check dependencies against "completedSections"?
    // A section is visible if its dependencies are complete.
    // However, we don't know "completedSections" yet? 
    // Wait, "completedSections" depends on question answers.
    // Questions depend on "visibleQuestions".
    // 
    // Issue: Dependency cycle? 
    // Section A depends on Section B. Section B must be complete.
    // Section B completion depends on its questions being answered.
    // 
    // Approach:
    // 1. Calculate completion for ALL sections (hypothetically, if they were visible).
    //    (A section can be "complete" data-wise even if not currently visible, or we define complete = visible AND data-complete)
    //    Actually, if a section is hidden, it cannot be "completed" in the context of stage progression usually.
    //    BUT, for checking dependencies, we need to know if the PREREQUISITE is complete.
    // 
    //    So:
    //    a. Calculate "Data Completion" for all sections (ignoring visibility for a moment, just check data).
    //    b. Use that to determine Visibility.
    //    c. The final "Completed Sections" list (for stage gates) should be those that are Data Complete AND Visible?
    //       Or does a hidden section count as complete? usually NO.
    // 
    // Let's iterate. 
    // Logic:
    // A section is "Data Complete" if required questions are answered.
    // A section is "Visible" if prerequisites are "Data Complete".
    // 
    // Let's try 2 passes or just calculation.

    // Pass 1: Check Data Completion for ALL active sections
    const dataCompleteSectionIds: string[] = [];
    activeSections.forEach(section => {
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
            dataCompleteSectionIds.push(section.id);
        }
    });

    // Pass 2: Determine Visibility based on Prerequisites
    activeSections.forEach(section => {
        let isVisible = true;
        if (section.depends_on_section_ids && section.depends_on_section_ids.length > 0) {
            // Check if all prereqs are Data Complete
            const prereqsMet = section.depends_on_section_ids.every(id => dataCompleteSectionIds.includes(id));
            if (!prereqsMet) isVisible = false;
        }

        if (isVisible) {
            visibleSectionIds.push(section.id);
            // If it's visible AND data complete, it's officially complete
            if (dataCompleteSectionIds.includes(section.id)) {
                completedSections.push(section.id);
            }
        }
    });

    // 4. Derive Phase: Identify Completed Stages
    // A stage is complete if ALL its assigned sections are complete.
    const completedStages: string[] = [];
    stages.forEach(stage => {
        const assignedSections = stage.section_ids || [];
        if (assignedSections.length > 0) {
            const allSectionsComplete = assignedSections.every(secId => completedSections.includes(secId));
            if (allSectionsComplete) {
                completedStages.push(stage.id);
            }
        }
        // If stage has no sections, is it auto-complete? Or manual? 
        // For now, if no sections, it's never "completed" by logic, essentially a container that might be manually managed.
    });


    // 5. Evaluate Stage Activation (C.7)
    const activeStages: string[] = [];
    stages.forEach(stage => {
        // Rule: Active if NO rules, OR if ALL required sections/stages are complete.
        if (!stage.activation_rules || Object.keys(stage.activation_rules).length === 0) {
            activeStages.push(stage.id);
        } else {
            // Check required_section_ids
            // REMOVED per user request (Stages only depend on Stages)
            // const requiredSectionIds = stage.activation_rules['required_section_ids'];
            const requiredStageIds = stage.activation_rules['required_stage_ids'];

            let rulesMet = true;

            // Check Stage Dependencies
            if (Array.isArray(requiredStageIds) && requiredStageIds.length > 0) {
                const allStagesDone = requiredStageIds.every(id => completedStages.includes(id));
                if (!allStagesDone) rulesMet = false;
            }

            if (rulesMet) {
                activeStages.push(stage.id);
            }
        }
    });

    // 6. Derive Required Actions (C.8)
    const requiredActions: RequiredAction[] = [];

    // For every active stage... (actually actions are usually tied to Sections in that stage, or questions)
    // "RequiredActions are generated when: Required questions are missing..."

    // Iterate all visible questions in active scopes (assuming all sections belong to a stage?)
    // For POC: Iterate all sections. If a section is incomplete, generate actions for missing Qs.

    activeSections.forEach(section => {
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
        visible_sections: visibleSectionIds,
        required_actions: requiredActions,
        is_eligible: true
    };
};
