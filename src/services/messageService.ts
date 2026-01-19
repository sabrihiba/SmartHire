import { db } from '@/config/firebaseConfig';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { Message } from '@/types/message';

const MESSAGES_COLLECTION = 'messages';

// Helper function to remove undefined fields (Firestore doesn't accept undefined)
const removeUndefinedFields = (obj: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

// Créer un message
export const createMessage = async (message: Omit<Message, 'id' | 'createdAt' | 'read'>): Promise<Message> => {
  const now = new Date().toISOString();
  const msgsRef = collection(db, MESSAGES_COLLECTION);
  const newMsgRef = doc(msgsRef);

  const newMessage: Message = {
    ...message,
    id: newMsgRef.id,
    createdAt: now,
    read: false,
  };

  // Remove undefined fields before sending to Firestore
  const cleanedMessage = removeUndefinedFields(newMessage);
  await setDoc(newMsgRef, cleanedMessage);
  return newMessage;
};

// Récupérer les messages d'une candidature
export const getMessagesByApplication = async (applicationId: string): Promise<Message[]> => {
  const msgsRef = collection(db, MESSAGES_COLLECTION);
  const q = query(
    msgsRef,
    where('applicationId', '==', applicationId)
  );

  const querySnapshot = await getDocs(q);
  const messages = querySnapshot.docs.map(doc => doc.data() as Message);

  return messages.sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

// Marquer un message comme lu
export const markMessageAsRead = async (messageId: string): Promise<void> => {
  const msgRef = doc(db, MESSAGES_COLLECTION, messageId);
  await setDoc(msgRef, { read: true }, { merge: true });
};
