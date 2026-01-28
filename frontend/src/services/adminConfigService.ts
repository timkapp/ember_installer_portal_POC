import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where, serverTimestamp } from 'firebase/firestore';
import type { Section, Question, Stage, InstallerOrganization, InstallerAccount, Invitation, Timestamp } from '../types';

// Collection References
const SECTIONS_COLLECTION = 'sections';
const QUESTIONS_COLLECTION = 'questions';
const STAGES_COLLECTION = 'stages';
const ORGANIZATIONS_COLLECTION = 'installer_organizations';
const INSTALLERS_COLLECTION = 'installer_accounts';
const INVITATIONS_COLLECTION = 'invitations';

// Logic to determine if we should use Mock (LocalStorage) or Real Firebase
const USE_MOCK = import.meta.env.VITE_USE_MOCK_BACKEND === 'true' ||
    !import.meta.env.VITE_FIREBASE_API_KEY ||
    import.meta.env.VITE_FIREBASE_API_KEY === 'dummy-key';

// --- HELPERS FOR MOCK DATA ---
const getMockData = <T>(key: string): T[] => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
};

const saveMockData = <T extends { id: string }>(key: string, item: T) => {
    const current = getMockData<T>(key);
    const index = current.findIndex(i => i.id === item.id);
    if (index >= 0) {
        current[index] = item;
    } else {
        current.push(item);
    }
    localStorage.setItem(key, JSON.stringify(current));
};

const deleteMockData = <T extends { id: string }>(key: string, id: string) => {
    const current = getMockData<T>(key);
    const filtered = current.filter(i => i.id !== id);
    localStorage.setItem(key, JSON.stringify(filtered));
};


// --- SECTIONS ---
export const getSections = async (): Promise<Section[]> => {
    if (USE_MOCK) return getMockData<Section>(SECTIONS_COLLECTION);
    const snapshot = await getDocs(collection(db, SECTIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Section));
};

export const saveSection = async (section: Section): Promise<void> => {
    if (USE_MOCK) return saveMockData(SECTIONS_COLLECTION, section);
    const docRef = doc(db, SECTIONS_COLLECTION, section.id);
    await setDoc(docRef, section, { merge: true });
};

export const deleteSection = async (sectionId: string): Promise<void> => {
    if (USE_MOCK) return deleteMockData(SECTIONS_COLLECTION, sectionId);
    await deleteDoc(doc(db, SECTIONS_COLLECTION, sectionId));
};

// --- QUESTIONS ---
export const getQuestions = async (): Promise<Question[]> => {
    if (USE_MOCK) return getMockData<Question>(QUESTIONS_COLLECTION);
    const snapshot = await getDocs(collection(db, QUESTIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
};

export const saveQuestion = async (question: Question): Promise<void> => {
    if (USE_MOCK) return saveMockData(QUESTIONS_COLLECTION, question);
    const docRef = doc(db, QUESTIONS_COLLECTION, question.id);
    await setDoc(docRef, question, { merge: true });
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
    if (USE_MOCK) return deleteMockData(QUESTIONS_COLLECTION, questionId);
    await deleteDoc(doc(db, QUESTIONS_COLLECTION, questionId));
};

// --- STAGES ---
export const getStages = async (): Promise<Stage[]> => {
    if (USE_MOCK) return getMockData<Stage>(STAGES_COLLECTION);
    const snapshot = await getDocs(collection(db, STAGES_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Stage));
};

export const saveStage = async (stage: Stage): Promise<void> => {
    if (USE_MOCK) return saveMockData(STAGES_COLLECTION, stage);
    const docRef = doc(db, STAGES_COLLECTION, stage.id);
    await setDoc(docRef, stage, { merge: true });
};

export const deleteStage = async (stageId: string): Promise<void> => {
    if (USE_MOCK) return deleteMockData(STAGES_COLLECTION, stageId);
    await deleteDoc(doc(db, STAGES_COLLECTION, stageId));
};

// --- ORGANIZATIONS ---
export const getOrganizations = async (): Promise<InstallerOrganization[]> => {
    if (USE_MOCK) return getMockData<InstallerOrganization>(ORGANIZATIONS_COLLECTION);
    const snapshot = await getDocs(collection(db, ORGANIZATIONS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InstallerOrganization));
};

export const createOrganization = async (name: string): Promise<InstallerOrganization> => {
    const id = doc(collection(db, ORGANIZATIONS_COLLECTION)).id;
    const newOrg: InstallerOrganization = {
        id,
        name,
        status: 'active',
        created_at: USE_MOCK ? new Date() as Timestamp : serverTimestamp() as unknown as Timestamp
    };

    if (USE_MOCK) {
        saveMockData(ORGANIZATIONS_COLLECTION, newOrg);
        return newOrg;
    }

    await setDoc(doc(db, ORGANIZATIONS_COLLECTION, id), newOrg);
    return newOrg;
};

// --- USERS & INVITATIONS (Admin View) ---
export const getUsersByOrganization = async (orgId: string): Promise<InstallerAccount[]> => {
    if (USE_MOCK) {
        const allUsers = getMockData<InstallerAccount>(INSTALLERS_COLLECTION);
        return allUsers.filter(u => u.organization_id === orgId);
    }
    const q = query(collection(db, INSTALLERS_COLLECTION), where('organization_id', '==', orgId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InstallerAccount));
};

export const getInvitationsByOrganization = async (orgId: string): Promise<Invitation[]> => {
    if (USE_MOCK) {
        // Mock invitations retrieval
        try {
            const invitationsMap = JSON.parse(localStorage.getItem('mock_invitations') || '{}');
            const allInvitations = Object.values(invitationsMap) as Invitation[];
            return allInvitations.filter(inv => inv.organization_id === orgId);
        } catch {
            return [];
        }
    }
    const q = query(collection(db, INVITATIONS_COLLECTION), where('organization_id', '==', orgId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
};
