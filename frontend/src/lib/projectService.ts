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
        approved_amount: 50000
    },
    {
        id: 'ca_2',
        organization_id: 'org_1',
        status: 'approved',
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_address: '456 Renewable Rd, Eco Town, CA',
        approved_amount: 75000
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
    return new Promise((resolve) => setTimeout(() => resolve('proj_' + Date.now()), 1000));
};

export const getProject = async (id: string): Promise<any> => {
    // Mock project
    return new Promise((resolve) => {
        setTimeout(() => resolve({
            id,
            customer_name: 'John Doe',
            address: '123 Solar Lane',
            status: 'In Progress',
            stage: 'Site Survey'
        }), 500);
    });
};

export const getProjectSections = async (_projectId: string): Promise<any[]> => {
    // Mock sections with questions
    // In real app, this would be specific to the project's stage or all sections
    return new Promise((resolve) => {
        setTimeout(() => resolve([
            {
                id: 's1',
                name: 'General Information',
                description: 'Basic project details',
                questions: [
                    { id: 'q1', label: 'System Size (kW)', question_type: 'number', mapped_field: 'project.system_size' },
                    { id: 'q2', label: 'Panel Type', question_type: 'text', mapped_field: 'project.panel_type' }
                ]
            },
            {
                id: 's2',
                name: 'Site Photos',
                description: 'Upload site survey photos',
                questions: [
                    { id: 'q3', label: 'Roof Photo', question_type: 'file_upload', mapped_field: 'project.roof_photo' }
                ]
            }
        ]), 500);
    });
};

export const submitSection = async (projectId: string, sectionId: string, data: any): Promise<void> => {
    console.log(`Submitting section ${sectionId} for project ${projectId}:`, data);

    // Mock Evaluation Trigger
    // In real app, we would load current state from DB
    console.log('Triggering lifecycle evaluation...');
    // Demo context (empty for now just to prove integration)
    const mockContext: any = {
        project: { id: projectId },
        credit_approval: { status: 'approved' },
        sections: [],
        questions: [],
        submissions: []
    };
    try {
        const result = evaluateProject(mockContext);
        console.log('Evaluation Result:', result);
    } catch (e) {
        console.warn('Evaluation failed due to mock data gaps', e);
    }

    return new Promise((resolve) => setTimeout(resolve, 800));
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
