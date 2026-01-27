import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// For prototype/dev, we can fallback to placeholders if env vars are missing, 
// to avoid crash, but ultimately need provided values.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-key",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "localhost",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ember-installer-portal-poc",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Use emulators if running locally and strictly configured
if (location.hostname === "localhost" && import.meta.env.VITE_USE_EMULATORS === "true") {
    // connectAuthEmulator(auth, "http://localhost:9099");
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectStorageEmulator(storage, "localhost", 9199);
    // connectFunctionsEmulator(functions, "localhost", 5001);
}
