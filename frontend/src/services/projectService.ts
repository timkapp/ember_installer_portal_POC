import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import type { Project, Customer } from '../types';

const PROJECTS_COLLECTION = 'projects';
const CUSTOMERS_COLLECTION = 'customers';

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

// --- PROJECTS ---
export const getProjects = async (): Promise<Project[]> => {
    if (USE_MOCK) return getMockData<Project>(PROJECTS_COLLECTION);
    const snapshot = await getDocs(collection(db, PROJECTS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
};

export const saveProject = async (project: Project): Promise<void> => {
    if (USE_MOCK) return saveMockData(PROJECTS_COLLECTION, project);
    const docRef = doc(db, PROJECTS_COLLECTION, project.id);
    await setDoc(docRef, project, { merge: true });
};

// --- CUSTOMERS ---
export const getCustomers = async (): Promise<Customer[]> => {
    if (USE_MOCK) return getMockData<Customer>(CUSTOMERS_COLLECTION);
    const snapshot = await getDocs(collection(db, CUSTOMERS_COLLECTION));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
};

export const saveCustomer = async (customer: Customer): Promise<void> => {
    if (USE_MOCK) return saveMockData(CUSTOMERS_COLLECTION, customer);
    const docRef = doc(db, CUSTOMERS_COLLECTION, customer.id);
    await setDoc(docRef, customer, { merge: true });
};
