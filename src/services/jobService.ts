import { db } from '@/config/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { Job } from '@/types/job';
import { removeUndefinedFields } from '@/utils';

const JOBS_COLLECTION = 'jobs';

// Créer une offre d'emploi
export const createJob = async (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> => {
  const now = new Date().toISOString();
  const jobsRef = collection(db, JOBS_COLLECTION);
  const newJobRef = doc(jobsRef);

  const newJob: Job = {
    ...job,
    id: newJobRef.id,
    createdAt: now,
    updatedAt: now,
    archived: job.archived ?? false, // Par défaut, non archivé
  };

  // Remove undefined fields before sending to Firestore
  const cleanedJob = removeUndefinedFields(newJob);
  await setDoc(newJobRef, cleanedJob);
  return newJob;
};

// Récupérer toutes les offres d'un recruteur
export const getJobsByRecruiter = async (recruiterId: string): Promise<Job[]> => {
  const jobsRef = collection(db, JOBS_COLLECTION);
  // Note: On retire orderBy pour éviter d'avoir besoin d'un index composite
  const q = query(
    jobsRef,
    where('recruiterId', '==', recruiterId)
  );

  const querySnapshot = await getDocs(q);
  const jobs = querySnapshot.docs.map(doc => doc.data() as Job);

  // Tri en mémoire
  return jobs.sort((a, b) =>
    new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
  );
};

// Récupérer toutes les offres disponibles (pour les candidats)
export const getAllJobs = async (): Promise<Job[]> => {
  const jobsRef = collection(db, JOBS_COLLECTION);
  // Note: On retire orderBy pour éviter d'avoir besoin d'un index composite
  const q = query(
    jobsRef,
    where('archived', '==', false)
  );

  const querySnapshot = await getDocs(q);
  const jobs = querySnapshot.docs.map(doc => doc.data() as Job);

  // Tri en mémoire
  return jobs.sort((a, b) =>
    new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
  );
};

// Récupérer une offre par ID
export const getJobById = async (id: string): Promise<Job | null> => {
  const jobRef = doc(db, JOBS_COLLECTION, id);
  const jobDoc = await getDoc(jobRef);

  if (!jobDoc.exists()) return null;
  return jobDoc.data() as Job;
};

// Mettre à jour une offre
export const updateJob = async (
  id: string,
  updates: Partial<Job>,
  recruiterId: string
): Promise<Job | null> => {
  const jobRef = doc(db, JOBS_COLLECTION, id);
  const jobDoc = await getDoc(jobRef);

  if (!jobDoc.exists() || jobDoc.data().recruiterId !== recruiterId) {
    return null;
  }

  const now = new Date().toISOString();
  // Remove undefined fields before sending to Firestore
  const cleanedUpdates = removeUndefinedFields({
    ...updates,
    updatedAt: now,
  });
  
  await updateDoc(jobRef, cleanedUpdates);

  return await getJobById(id);
};

// Vérifier si une offre a des candidatures
export const hasApplications = async (jobId: string): Promise<boolean> => {
  const appsRef = collection(db, 'applications');
  const q = query(appsRef, where('jobId', '==', jobId), limit(1));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

// Archiver/Désarchiver une offre
export const toggleJobArchive = async (id: string, recruiterId: string, archived: boolean): Promise<boolean> => {
  const jobRef = doc(db, JOBS_COLLECTION, id);
  const jobDoc = await getDoc(jobRef);

  if (!jobDoc.exists() || jobDoc.data().recruiterId !== recruiterId) {
    return false;
  }

  await updateDoc(jobRef, {
    archived,
    updatedAt: new Date().toISOString(),
  });
  return true;
};

// Supprimer une offre
export const deleteJob = async (id: string, recruiterId: string): Promise<boolean> => {
  const jobRef = doc(db, JOBS_COLLECTION, id);
  const jobDoc = await getDoc(jobRef);

  if (!jobDoc.exists() || jobDoc.data().recruiterId !== recruiterId) {
    return false;
  }

  await deleteDoc(jobRef);
  return true;
};
