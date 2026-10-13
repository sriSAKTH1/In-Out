import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendEmailVerification,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged,
  getAdditionalUserInfo,
} from 'firebase/auth';
import type { User, Auth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCgUfr5lZGrIZr74RVfEtgMNQYYfAAIGpY';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'in-out-f3b53.firebaseapp.com';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'in-out-f3b53';
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'in-out-f3b53.firebasestorage.app';
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '500309169171';
const appId = import.meta.env.VITE_FIREBASE_APP_ID || '1:500309169171:web:8dced827e141c86951dbe6';
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-0QJK548990';

export const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
};

let authInstance: Auth | null = null;
let googleProviderInstance: GoogleAuthProvider | null = null;
let dbInstance: Firestore | null = null;
let isConfigured = false;

try {
  if (apiKey && apiKey !== 'your_api_key_here' && projectId && projectId !== 'your_project_id') {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    googleProviderInstance = new GoogleAuthProvider();
    dbInstance = getFirestore(app);
    isConfigured = true;
  }
} catch (err) {
  console.warn('Firebase initialization skipped or failed:', err);
  authInstance = null;
  googleProviderInstance = null;
  dbInstance = null;
  isConfigured = false;
}

export const isFirebaseConfigured = isConfigured;
export const auth = authInstance;
export const googleProvider = googleProviderInstance;
export const db = dbInstance;

export {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  firebaseSignOut,
  firebaseSendEmailVerification,
  firebaseUpdateProfile,
  onAuthStateChanged,
  getAdditionalUserInfo,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
};
export type { User, Firestore };
