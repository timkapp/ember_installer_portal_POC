import {
    collection,
    doc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { type Invitation, type InstallerAccount } from '../types';

const INVITATIONS_COLLECTION = 'invitations';
const INSTALLERS_COLLECTION = 'installer_accounts';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_BACKEND === 'true';

// Helper to generate a random token
const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const createInvitation = async (organizationId: string, email: string, adminId: string): Promise<string> => {
    const token = generateToken();
    const invitationId = USE_MOCK ? `mock-invite-${Date.now()}` : doc(collection(db, INVITATIONS_COLLECTION)).id;

    // expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const createdAt = new Date();

    const invitation: Invitation = {
        id: invitationId,
        email,
        organization_id: organizationId,
        token_hash: token, // In a real app, hash this! For POC, storing plain token.
        expires_at: expiresAt as unknown as Timestamp,
        created_by_admin_id: adminId,
        created_at: createdAt as unknown as Timestamp
    };

    if (USE_MOCK) {
        console.log("MOCK DB: Creating invitation", invitation);
        // Persist to localStorage for persistence across reloads
        const existing = JSON.parse(localStorage.getItem('mock_invitations') || '{}');
        existing[token] = {
            ...invitation,
            expires_at: expiresAt.toISOString(),
            created_at: createdAt.toISOString()
        };
        localStorage.setItem('mock_invitations', JSON.stringify(existing));
        return token;
    }

    await setDoc(doc(db, INVITATIONS_COLLECTION, invitationId), invitation);
    return token;
};

export const validateInvitation = async (token: string): Promise<Invitation | null> => {
    if (USE_MOCK) {
        const existing = JSON.parse(localStorage.getItem('mock_invitations') || '{}');
        const inviteData = existing[token];
        if (!inviteData) return null;
        if (inviteData.accepted_at) return null; // Already accepted

        // Deserialize dates
        const inv: Invitation = {
            ...inviteData,
            expires_at: new Date(inviteData.expires_at),
            created_at: new Date(inviteData.created_at)
        };

        if (inv.expires_at < new Date()) return null;

        return inv;
    }

    // Determine validity
    // Since we don't have a direct lookup by token (unless we index it), 
    // we might need to change the architecture to use token as ID or index it.
    // For POC, let's query by token_hash.
    const q = query(
        collection(db, INVITATIONS_COLLECTION),
        where('token_hash', '==', token),
        where('accepted_at', '==', null)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const docData = querySnapshot.docs[0].data() as Invitation;

    // Check expiration
    const now = new Date();
    // Firestore Timestamp conversion if needed
    const expires = docData.expires_at instanceof Timestamp ? docData.expires_at.toDate() : docData.expires_at;

    if (expires < now) {
        return null; // Expired
    }

    return { ...docData, id: querySnapshot.docs[0].id };
};

export const acceptInvitation = async (
    token: string,
    userData: { name: string, password: string }
): Promise<void> => {
    const invitation = await validateInvitation(token);
    if (!invitation) throw new Error("Invalid or expired invitation");

    if (USE_MOCK) {
        console.log("MOCK DB: Accepting invitation", token, userData);

        // Update mock invitation
        const existing = JSON.parse(localStorage.getItem('mock_invitations') || '{}');
        if (existing[token]) {
            existing[token].accepted_at = new Date().toISOString();
            localStorage.setItem('mock_invitations', JSON.stringify(existing));
        }

        // Create mock user (if needed for list)
        // Note: Auth mock is tricky, we just simulate success here.
        console.log("MOCK AUTH: Created user", userData.name);
        return;
    }

    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, invitation.email, userData.password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: userData.name });

    // 2. Create Installer Account
    const newInstaller: InstallerAccount = {
        id: user.uid,
        email: invitation.email,
        name: userData.name,
        organization_id: invitation.organization_id,
        auth_methods: {
            google: false,
            email_password: true
        },
        status: 'active',
        created_at: serverTimestamp() as Timestamp, // Use server timestamp
        activated_at: serverTimestamp() as Timestamp
    };

    await setDoc(doc(db, INSTALLERS_COLLECTION, user.uid), newInstaller);

    // 3. Mark invitation as accepted
    await updateDoc(doc(db, INVITATIONS_COLLECTION, invitation.id), {
        accepted_at: serverTimestamp()
    });
};
