import type { UserProfile } from '../types';
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  firebaseSignOut,
  firebaseSendEmailVerification,
  firebaseUpdateProfile,
  onAuthStateChanged,
  getAdditionalUserInfo,
} from './firebase';

const LOCAL_USER_KEY = 'inandout_current_user_v1';
const AUTH_CHANGE_EVENT = 'inandout_auth_change';

const notifyAuthListeners = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
  }
};

export const authService = {
  isCloudAuthActive: (): boolean => isFirebaseConfigured && auth !== null,

  getUserProfile: (): UserProfile | null => {
    try {
      const data = localStorage.getItem(LOCAL_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  signUp: async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string; profile?: UserProfile }> => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      return { success: false, message: 'Please fill out all required fields.' };
    }

    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters long.' };
    }

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCredential.user;

        // Set display name in Firebase Profile
        await firebaseUpdateProfile(user, { displayName: trimmedName });

        // Send activation / email verification email
        try {
          await firebaseSendEmailVerification(user);
        } catch (verr) {
          console.warn('Email verification send warning:', verr);
        }

        const profile: UserProfile = {
          id: user.uid,
          name: trimmedName,
          email: trimmedEmail,
          created_at: new Date().toISOString(),
          auth_provider: 'firebase',
          email_verified: user.emailVerified,
        };

        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        notifyAuthListeners();

        return {
          success: true,
          profile,
          message: 'Account created successfully! An activation link has been sent to your email.',
        };
      } catch (err: any) {
        let errMs = err.message || 'Firebase sign up failed.';
        if (err.code === 'auth/email-already-in-use') errMs = 'An account with this email already exists.';
        if (err.code === 'auth/invalid-email') errMs = 'Please enter a valid email address.';
        if (err.code === 'auth/weak-password') errMs = 'Password should be at least 6 characters.';
        return { success: false, message: errMs };
      }
    }

    // Fallback local mode
    const profile: UserProfile = {
      id: `usr_local_${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      created_at: new Date().toISOString(),
      auth_provider: 'local',
      email_verified: true,
    };

    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
    notifyAuthListeners();
    return { success: true, profile };
  },

  signIn: async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string; profile?: UserProfile }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !password) {
      return { success: false, message: 'Please enter both email and password.' };
    }

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCredential.user;

        const profile: UserProfile = {
          id: user.uid,
          name: user.displayName || trimmedEmail.split('@')[0],
          email: trimmedEmail,
          created_at: new Date().toISOString(),
          auth_provider: 'firebase',
          email_verified: user.emailVerified,
        };

        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        notifyAuthListeners();
        return { success: true, profile };
      } catch (err: any) {
        let errMs = err.message || 'Firebase sign in failed.';
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password'
        ) {
          errMs = 'Invalid email or password.';
        }
        return { success: false, message: errMs };
      }
    }

    // Fallback local mode
    const existing = authService.getUserProfile();
    if (existing && existing.email === trimmedEmail) {
      notifyAuthListeners();
      return { success: true, profile: existing };
    }

    const newProfile: UserProfile = {
      id: `usr_local_${Date.now()}`,
      name: trimmedEmail.split('@')[0],
      email: trimmedEmail,
      created_at: new Date().toISOString(),
      auth_provider: 'local',
      email_verified: true,
    };

    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newProfile));
    notifyAuthListeners();
    return { success: true, profile: newProfile };
  },

  signInWithGoogle: async (): Promise<{ success: boolean; message?: string; profile?: UserProfile; isNewUser?: boolean }> => {
    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const additionalInfo = getAdditionalUserInfo(result);
        const isNewUser = additionalInfo?.isNewUser ?? false;

        const profile: UserProfile = {
          id: user.uid,
          name: user.displayName || 'Google User',
          email: user.email || '',
          created_at: new Date().toISOString(),
          auth_provider: 'google',
          email_verified: true,
        };

        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        notifyAuthListeners();
        return { success: true, profile, isNewUser };
      } catch (err: any) {
        console.error('Google Sign In Error:', err);
        let errMs = err.message || 'Google Authentication failed.';
        if (err.code === 'auth/popup-closed-by-user') errMs = 'Google Sign-In popup was closed.';
        return { success: false, message: errMs };
      }
    }

    // Demo fallback for Google Auth
    const googleProfile: UserProfile = {
      id: `usr_google_${Date.now()}`,
      name: 'Google User',
      email: 'user@gmail.com',
      created_at: new Date().toISOString(),
      auth_provider: 'google',
      email_verified: true,
    };

    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(googleProfile));
    notifyAuthListeners();
    // For local fallback, we can assume they are new if they don't exist in local storage.
    // However, the fallback currently ALWAYS creates a new user profile with a new Date ID.
    return { success: true, profile: googleProfile, isNewUser: true };
  },

  signOut: async (): Promise<void> => {
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.warn('Firebase SignOut error:', err);
      }
    }
    localStorage.removeItem(LOCAL_USER_KEY);
    notifyAuthListeners();
  },

  updateProfile: async (newName: string): Promise<UserProfile | null> => {
    const current = authService.getUserProfile();
    if (!current) return null;

    const updated = { ...current, name: newName.trim() };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(updated));

    if (isFirebaseConfigured && auth && auth.currentUser) {
      try {
        await firebaseUpdateProfile(auth.currentUser, { displayName: newName.trim() });
      } catch (err) {
        console.warn('Firebase update profile error:', err);
      }
    }

    notifyAuthListeners();
    return updated;
  },

  subscribeAuthChange: (callback: () => void): (() => void) => {
    const handler = () => callback();
    window.addEventListener(AUTH_CHANGE_EVENT, handler);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handler);
  },
};

// Initialize Firebase Auth State Listener
if (isFirebaseConfigured && auth) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const current = authService.getUserProfile();
      if (!current || current.id !== user.uid) {
        const profile: UserProfile = {
          id: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          created_at: new Date().toISOString(),
          auth_provider: user.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'firebase',
          email_verified: user.emailVerified,
        };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
        notifyAuthListeners();
      }
    }
  });
}
