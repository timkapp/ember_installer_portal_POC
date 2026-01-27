import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import type { Section, Question, Stage } from '../types';

// Collection References
const SECTIONS_COLLECTION = 'sections';
const QUESTIONS_COLLECTION = 'questions';
const STAGES_COLLECTION = 'stages';

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
