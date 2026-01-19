import { auth, db } from '@/config/firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Credentials, SignupPayload, AuthTokens } from '@/types/auth';
import type { User } from '@/types';
import { UserRole } from '@/types';
import { removeUndefinedFields } from '@/utils';

// Simple tokens for compatibility with existing AuthProvider
const createTokens = (email: string): AuthTokens => ({
  accessToken: `firebase-${email}-${Date.now()}`,
  refreshToken: `firebase-refresh-${email}-${Date.now()}`,
});

export const login = async (credentials: Credentials): Promise<{ user: User; tokens: AuthTokens }> => {
  const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
  const firebaseUser = userCredential.user;

  // Get user profile from Firestore
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  if (!userDoc.exists()) {
    throw new Error('User profile not found');
  }

  const userData = userDoc.data();
  const user: User = {
    id: firebaseUser.uid,
    name: userData.name,
    email: userData.email,
    role: userData.role as UserRole,
  };

  return { user, tokens: createTokens(firebaseUser.email!) };
};

export const signup = async (payload: SignupPayload): Promise<{ user: User; tokens: AuthTokens }> => {
  const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
  const firebaseUser = userCredential.user;

  const userRole = payload.role === 'recruiter' ? UserRole.RECRUITER : UserRole.CANDIDATE;

  // Create user profile in Firestore
  const user: User = {
    id: firebaseUser.uid,
    name: payload.name,
    email: payload.email,
    role: userRole,
  };

  // Remove undefined fields before sending to Firestore
  const userData = removeUndefinedFields({
    ...user,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  await setDoc(doc(db, 'users', firebaseUser.uid), userData);

  return { user, tokens: createTokens(firebaseUser.email!) };
};

export const logout = async () => {
  await signOut(auth);
};

export const restoreSession = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            resolve({
              id: firebaseUser.uid,
              name: userData.name,
              email: userData.email,
              role: userData.role as UserRole,
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          console.error('Error restoring session:', error);
          resolve(null);
        }
      } else {
        resolve(null);
      }
    });
  });
};
