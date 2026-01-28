export type Timestamp = {
    seconds: number;
    nanoseconds: number;
} | Date;

// B.2.1 InstallerAccount
export interface InstallerAccount {
    id: string;
    email: string;
    name: string;
    organization_id: string;
    auth_methods: {
        google: boolean;
        email_password: boolean;
    };
    status: 'pending' | 'active' | 'suspended';
    created_at: Timestamp;
    activated_at?: Timestamp | null;
}

// B.2.2 InstallerOrganization
export interface InstallerOrganization {
    id: string;
    name: string;
    status: 'active' | 'inactive';
    created_at: Timestamp;
}

// B.2.3 AdminAccount
export interface AdminAccount {
    id: string;
    email: string;
    name: string;
    roles: string[];
    created_at: Timestamp;
}

// B.2.4 Invitation
export interface Invitation {
    id: string;
    email: string;
    organization_id: string;
    token_hash: string;
    expires_at: Timestamp;
    accepted_at?: Timestamp | null;
    created_by_admin_id: string;
    created_at: Timestamp;
}

// B.3.1 CreditApproval
export interface CreditApproval {
    id: string;
    organization_id: string;
    status: 'approved' | 'unapproved';
    approved_amount: number;
    customer_name: string;
    customer_address: string;
    customer_phone: string;
    customer_email: string;
    source_system: string;
    created_at: Timestamp;
    expires_at?: Timestamp | null;
}

// B.3.2 Customer
export interface Customer {
    id: string;
    organization_id: string;
    credit_approval_id: string;
    name: string;
    address: string;
    contact_info: Record<string, any>;
    created_at: Timestamp;
    last_updated_at: Timestamp;
}

// B.3.3 Project (Lease)
export interface Project {
    id: string;
    organization_id: string;
    customer_id: string;
    credit_approval_id: string;
    status: string; // Lifecycle state is derived
    active_stages: string[]; // List of currently active stage IDs
    created_at: Timestamp;
    last_updated_at: Timestamp;
}

// B.3.4 Stage
export interface Stage {
    id: string;
    name: string;
    description: string;
    activation_rules: Record<string, any>;
    section_ids: string[];
    stage_type: 'terminal' | 'reentrant';
    status: 'active' | 'draft';
    order?: number;
    // Determines if this stage is visible to installers in the portal override
    isVisibleToInstaller?: boolean;
}

// B.3.5 StageAssignment (Derived)
export interface StageAssignment {
    project_id: string;
    stage_id: string;
    activated_at: Timestamp;
}

// B.4.1 Question
export type QuestionType = 'text' | 'number' | 'boolean' | 'file_upload' | 'select' | 'date';

export interface Question {
    id: string;
    label: string;
    instructions: string;
    question_type: QuestionType;
    data_type: string;
    mapped_field?: string;
    requires_approval: boolean;
    conditional_rule?: {
        field: string;
        operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'true' | 'false';
        value: any;
    };
    // File Upload specific
    allowed_file_types?: string[];
    max_file_size_mb?: number;

    // Select options
    options?: { label: string; value: any }[];
}

// B.4.2 Section
export interface Section {
    id: string;
    name: string;
    description: string;
    required_question_ids: string[];
    optional_question_ids: string[];
    question_order?: string[]; // Unified display order
    depends_on_section_ids?: string[];
    conditional_question_rule?: {
        question_id: string;
        operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'true' | 'false';
        value: any;
    };
    status: 'active' | 'draft';
}

// B.5.1 Submission
export interface Submission {
    id: string;
    project_id: string;
    question_id: string;
    value_reference: {
        // Canonical field pointer
        mapped_field?: { scope: 'project' | 'customer'; key: string };
        // Or direct value if not mapped? The spec says value_reference is "canonical field pointer or file reference".
        // But Appendix E says "value: any" for canonical field.
        value?: any;
        // File upload
        file?: {
            storage_path: string;
            filename: string;
            content_type: string;
            size_bytes: number;
            download_url: string;
        };
    };
    state: 'empty' | 'submitted' | 'approved' | 'rejected';
    submitted_by_installer_id: string;
    submitted_at: Timestamp;
    reviewed_at?: Timestamp | null;
}

// B.5.2 Approval
export interface Approval {
    id: string;
    submission_id: string;
    admin_id: string;
    decision: 'approved' | 'rejected';
    feedback?: string;
    timestamp: Timestamp;
}

// B.8.1 AuditLog
export interface AuditLog {
    id: string;
    actor_type: 'installer' | 'admin' | 'system';
    actor_id: string;
    event_type: string;
    entity_type: string; // e.g., 'project', 'submission'
    entity_id: string;
    timestamp: Timestamp;
    metadata?: Record<string, any>;
}

// B.7.1 RequiredAction (Derived)
export interface RequiredAction {
    project_id: string;
    question_id: string;
    reason: 'missing' | 'rejected' | 'awaiting_approval';
    stage_context: string;
}
