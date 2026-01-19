import { db } from '@/config/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { User, UserRole } from '@/types';
import { removeUndefinedFields } from '@/utils';

// Créer un utilisateur (généralement appelé après signup)
export const createUser = async (userData: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  [key: string]: any;
}): Promise<User> => {
  const now = new Date().toISOString();
  const userRef = doc(db, 'users', userData.id);

  const newUserData = {
    ...userData,
    createdAt: now,
    updatedAt: now,
  };

  // Remove undefined fields before sending to Firestore
  const cleanedUserData = removeUndefinedFields(newUserData);
  await setDoc(userRef, cleanedUserData);

  const { password, ...userWithoutPassword } = newUserData as any;
  return userWithoutPassword;
};

// Récupérer un utilisateur par email (utile pour vérifier l'existence)
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) return null;

  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
};

// Récupérer un utilisateur par ID
export const getUserById = async (id: string): Promise<User | null> => {
  const userRef = doc(db, 'users', id);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) return null;

  return { id: userDoc.id, ...userDoc.data() } as User;
};

// Mettre à jour un utilisateur
export const updateUser = async (id: string, updates: Partial<User>): Promise<User | null> => {
  const userRef = doc(db, 'users', id);
  const now = new Date().toISOString();

  // Remove undefined fields before sending to Firestore
  const cleanedUpdates = removeUndefinedFields({
    ...updates,
    updatedAt: now,
  });
  
  await updateDoc(userRef, cleanedUpdates);

  return await getUserById(id);
};
