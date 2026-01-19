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
import { ApplicationHistory, ApplicationStatus } from '@/types/jobApplication';
import { removeUndefinedFields } from '@/utils';

const HISTORY_COLLECTION = 'application_history';

// Ajouter une entrée dans l'historique
export const addApplicationHistory = async (
  applicationId: string,
  oldStatus: ApplicationStatus | undefined,
  newStatus: ApplicationStatus,
  changedBy: string,
  notes?: string
): Promise<void> => {
  try {
    const historyRef = collection(db, HISTORY_COLLECTION);
    const newHistoryRef = doc(historyRef);

    const newHistory: ApplicationHistory = {
      id: newHistoryRef.id,
      applicationId,
      oldStatus,
      newStatus,
      changedBy,
      changedAt: new Date().toISOString(),
      notes,
    };

    // Remove undefined fields before sending to Firestore
    const cleanedHistory = removeUndefinedFields(newHistory);
    await setDoc(newHistoryRef, cleanedHistory);
  } catch (error) {
    console.error('Error adding application history:', error);
  }
};

// Récupérer l'historique d'une candidature
export const getApplicationHistory = async (applicationId: string): Promise<ApplicationHistory[]> => {
  try {
    const historyRef = collection(db, HISTORY_COLLECTION);
    const q = query(
      historyRef,
      where('applicationId', '==', applicationId)
    );

    const querySnapshot = await getDocs(q);
    const history = querySnapshot.docs.map(doc => doc.data() as ApplicationHistory);

    // Sort in memory
    return history.sort((a, b) =>
      new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    );
  } catch (error) {
    console.error('Error getting application history:', error);
    return [];
  }
};
