import { evaluateProject } from './evaluationEngine';

// Types (should actally be in types/index.ts but simplified here for speed if needed, 
// using 'any' to unblock or importing from types if I update them)
// I'll assume usage of the defined types or lightweight interfaces if they are missing.

export interface CreditApproval {
    id: string;
    organization_id: string;
    status: 'approved' | 'unapproved';
    customer_name: string;
    customer_email: string;
    customer_address: string;
    approved_amount: number;
    created_at: Date;
    match_status: 'New' | 'Existing';
}

// Mock Data for Prototype
const MOCK_CREDIT_APPROVALS: CreditApproval[] = [
    {
        id: 'ca_1',
        organization_id: 'org_1',
        status: 'approved',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_address: '123 Solar Lane, Sun City, AZ',
        approved_amount: 50000,
        created_at: new Date('2023-11-15'),
        match_status: 'New'
    },
    {
        id: 'ca_2',
        organization_id: 'org_1',
        status: 'approved',
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_address: '456 Renewable Rd, Eco Town, CA',
        approved_amount: 75000,
        created_at: new Date('2023-11-20'),
        match_status: 'Existing'
    },
    {
        id: 'ca_3',
        organization_id: 'org_1',
        status: 'approved',
        customer_name: 'Bob Johnson',
        customer_email: 'bob@example.com',
        customer_address: '789 Green St, Sustainable City, TX',
        approved_amount: 60000,
        created_at: new Date('2023-11-10'),
        match_status: 'New'
    }
];

export const getCreditApprovals = async (orgId: string): Promise<CreditApproval[]> => {
    // In real app: fetch from Firestore
    // const q = query(collection(db, 'credit_approvals'), where('organization_id', '==', orgId), where('status', '==', 'approved'));
    // ...
    // For prototype mock:
    console.log(`Fetching credit approvals for org ${orgId}`);
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_CREDIT_APPROVALS), 500);
    });
};

export const createProject = async (
    creditApproval: CreditApproval,
    customerData: any // Updated customer data from wizard
): Promise<string> => {
    // 1. Create Customer
    // In a real app, strict transaction.
    // Here we just simulate or write to Firestore if rules allow.

    // const customerRef = await addDoc(collection(db, 'customers'), {
    //     ...customerData,
    //     credit_approval_id: creditApproval.id,
    //     organization_id: creditApproval.organization_id,
    //     created_at: serverTimestamp()
    // });

    // 2. Create Project
    // const projectRef = await addDoc(collection(db, 'projects'), {
    //     customer_id: customerRef.id,
    //     credit_approval_id: creditApproval.id,
    //     organization_id: creditApproval.organization_id,
    //     status: 'new', // Derived state might override
    //     created_at: serverTimestamp()
    // });

    // return projectRef.id;

    console.log('Creating project with:', { creditApproval, customerData });

    // Simulate creation
    return new Promise((resolve) => {
        setTimeout(async () => {
            const projectId = 'proj_' + Date.now();

            // 1. Create Initial Project State
            const stages = await getStages();
            const visibleStages = stages.filter(s => s.isVisibleToInstaller !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
            const initialStage = visibleStages.length > 0 ? visibleStages[0].name : 'Site Survey';

            const project = {
                id: projectId,
                customer_id: 'cust_' + Date.now(), // Mock customer ID
                customer_name: creditApproval.customer_name,
                address: creditApproval.customer_address,
                status: 'In Progress', // Status from list view
                stage: initialStage,
                active_stages: visibleStages.length > 0 ? [visibleStages[0].id] : [],
                organization_id: creditApproval.organization_id,
                created_at: new Date()
            };

            // 2. Save Detail (Individual Key)
            saveMockProjectState(projectId, project);

            // 3. Update Central Registry (for ProjectList)
            // 'projects' key is used by services/projectService.ts
            try {
                const existingListStr = localStorage.getItem('projects');
                const existingList = existingListStr ? JSON.parse(existingListStr) : [];
                existingList.push(project);
                localStorage.setItem('projects', JSON.stringify(existingList));
            } catch (e) {
                console.error("Failed to update projects registry", e);
            }

            // Also need to save customer for ProjectList join
            try {
                const customersStr = localStorage.getItem('customers');
                const customers = customersStr ? JSON.parse(customersStr) : [];
                customers.push({
                    id: project.customer_id,
                    name: project.customer_name,
                    address: project.address,
                    email: creditApproval.customer_email
                });
                localStorage.setItem('customers', JSON.stringify(customers));
            } catch (e) { /* ignore */ }

            resolve(projectId);
        }, 1000);
    });
};

import { getStages, getSections } from '../services/adminConfigService';

// Helper to manage mock state
const getMockProjectState = (projectId: string) => {
    try {
        const item = localStorage.getItem(`mock_project_${projectId}`);
        return item ? JSON.parse(item) : null;
    } catch { return null; }
};

const saveMockProjectState = (projectId: string, state: any) => {
    localStorage.setItem(`mock_project_${projectId}`, JSON.stringify(state));
};

const getMockSubmissions = (projectId: string) => {
    try {
        const item = localStorage.getItem(`mock_submissions_${projectId}`);
        return item ? JSON.parse(item) : {};
    } catch { return {}; }
};

export const getSubmissions = async (projectId: string): Promise<any[]> => {
    // Return flat list of submissions
    const submissions = getMockSubmissions(projectId);
    const submissionArray: any[] = [];
    Object.values(submissions).forEach((sectionData: any) => {
        if (sectionData && typeof sectionData === 'object') {
            Object.keys(sectionData).forEach(qId => {
                submissionArray.push({
                    question_id: qId,
                    value: sectionData[qId],
                    state: 'submitted' // mock default
                });
            });
        }
    });
    return submissionArray;
};

const saveMockSubmission = (projectId: string, sectionId: string, data: any) => {
    const submissions = getMockSubmissions(projectId);
    submissions[sectionId] = data;
    localStorage.setItem(`mock_submissions_${projectId}`, JSON.stringify(submissions));
};

export const getProject = async (id: string): Promise<any> => {
    // Mock project - Stateful
    return new Promise((resolve) => {
        setTimeout(async () => {
            let project = getMockProjectState(id);
            if (!project) {
                // Initialize default mock project if not exists
                // Get first stage to start with
                const stages = await getStages();
                const visibleStages = stages.filter(s => s.isVisibleToInstaller !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
                const initialStage = visibleStages.length > 0 ? visibleStages[0].name : 'Site Survey';

                project = {
                    id,
                    customer_name: 'John Doe',
                    address: '123 Solar Lane',
                    status: 'In Progress',
                    stage: initialStage, // Legacy field, keeping for fallback
                    active_stages: visibleStages.length > 0 ? [visibleStages[0].id] : []
                };
                saveMockProjectState(id, project);
            }
            resolve(project);
        }, 500);
    });
};

export const submitSection = async (projectId: string, sectionId: string, data: any): Promise<{ stageComplete: boolean, newStage?: string, newStages?: string[] }> => {
    console.log(`Submitting section ${sectionId} for project ${projectId}:`, data);

    // Save submission
    saveMockSubmission(projectId, sectionId, data);

    return new Promise((resolve) => {
        setTimeout(async () => {
            // Check for Stage Completion & Activation
            try {
                // 1. Prepare Context
                const project = getMockProjectState(projectId);
                const allStages = await getStages();
                const allSections = await getSections();
                const allQuestions = await import('../services/adminConfigService').then(m => m.getQuestions());
                const submissions = getMockSubmissions(projectId);

                // Convert mock submissions object format (SectionId -> { QId -> Val }) to flat array for evaluation
                const submissionArray: any[] = [];
                Object.values(submissions).forEach((sectionData: any) => {
                    if (sectionData && typeof sectionData === 'object') {
                        Object.keys(sectionData).forEach(qId => {
                            submissionArray.push({
                                question_id: qId,
                                value: sectionData[qId],
                                state: 'submitted' // mock state
                            });
                        });
                    }
                });

                const context = {
                    project: project,
                    customer: { id: 'cust_1' } as any, // Mock customer
                    credit_approval: { status: 'approved' } as any, // Mock approval
                    stages: allStages,
                    sections: allSections,
                    questions: allQuestions,
                    submissions: submissionArray as any
                };

                // Debug: Log Questions Configuration
                console.log("DEBUG: Evaluating with Questions:", allQuestions.map(q => ({
                    id: q.id,
                    label: q.label,
                    requires_approval: q.requires_approval
                })));

                // Debug: Log Submissions
                console.log("DEBUG: Submissions:", submissionArray);

                // 2. Evaluate
                const result = evaluateProject(context);
                console.log("Evaluation Result:", {
                    active: result.active_stages,
                    completedSec: result.completed_sections,
                    completedStg: (result as any).completed_stages || "N/A" // interface might hide it but calc has it? Wait, interface has active_stages. completed_stages IS internal to evaluateProject usually, but let's check return.
                    // The interface has completed_sections. It does NOT have completed_stages returned.
                    // But we can infer it or log it inside evaluateProject if needed.
                });

                // 3. Update Project State
                // Store active stages
                const oldStages = project.active_stages || [];
                project.active_stages = result.active_stages;

                // Legacy: Set 'stage' to the first active one, or highest priority?
                // Visual fallback: Name of the last active stage (highest order)
                const activeConfigs = allStages.filter(s => result.active_stages.includes(s.id));
                activeConfigs.sort((a, b) => (a.order || 0) - (b.order || 0));
                if (activeConfigs.length > 0) {
                    project.stage = activeConfigs[activeConfigs.length - 1].name;
                }

                saveMockProjectState(projectId, project);

                // 4. Return Delta
                // Find newly activated stages
                const newStages = result.active_stages.filter(id => !oldStages.includes(id));

                // Determine if "current" stage (the one section belongs to) is complete? 
                // Not strictly needed if UI just reloads active_stages. 
                // But for Snackbar message:
                resolve({ stageComplete: newStages.length > 0, newStage: newStages[0], newStages: newStages });

            } catch (e) {
                console.error("Auto-advance logic failed", e);
                resolve({ stageComplete: false });
            }
        }, 800);
    });
};

export const reviewSubmission = async (
    projectId: string,
    sectionId: string,
    decision: 'approved' | 'rejected',
    reason?: string
): Promise<void> => {
    console.log(`Reviewing project ${projectId}, section ${sectionId}: ${decision} ${reason ? `(${reason})` : ''}`);
    return new Promise((resolve) => setTimeout(resolve, 500));
};
