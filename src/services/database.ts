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
  addDoc
} from 'firebase/firestore';
import { JobApplication, ApplicationStatus } from '@/types/jobApplication';

const APPLICATIONS_COLLECTION = 'applications';

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

export const initDatabase = async (): Promise<void> => {
  // Firebase initialization is handled in firebaseConfig.ts
  console.log('Firebase (Firestore/Auth) initialized');
};

export const getDatabase = () => db;

// Applications CRUD
export const getAllApplications = async (userId: string): Promise<JobApplication[]> => {
  const appsRef = collection(db, APPLICATIONS_COLLECTION);
  // Remove orderBy to avoid composite index requirement
  const q = query(
    appsRef,
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const apps = querySnapshot.docs.map(doc => doc.data() as JobApplication);

  // In-memory sort
  return apps.sort((a, b) =>
    new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
  );
};

export const getApplicationById = async (id: string, requestorId: string): Promise<JobApplication | null> => {
  const appRef = doc(db, APPLICATIONS_COLLECTION, id);
  const appDoc = await getDoc(appRef);

  if (!appDoc.exists()) return null;

  const data = appDoc.data() as JobApplication;
  // Allow access if user is the applicant OR the recruiter
  if (data.userId !== requestorId && data.recruiterId !== requestorId) return null;

  return data;
};

export const hasUserAppliedToJob = async (userId: string, jobId: string): Promise<boolean> => {
  const appsRef = collection(db, APPLICATIONS_COLLECTION);
  const q = query(
    appsRef,
    where('userId', '==', userId),
    where('jobId', '==', jobId)
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

export const createApplication = async (application: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobApplication> => {
  const now = new Date().toISOString();
  const appsRef = collection(db, APPLICATIONS_COLLECTION);
  const newAppRef = doc(appsRef);

  const newApp: JobApplication = {
    ...application,
    id: newAppRef.id,
    createdAt: now,
    updatedAt: now,
  };

  // Remove undefined fields before sending to Firestore
  const cleanedApp = removeUndefinedFields(newApp);
  await setDoc(newAppRef, cleanedApp);
  
  return newApp;
};

export const updateApplication = async (
  id: string,
  updates: Partial<JobApplication>,
  requestorId: string
): Promise<JobApplication | null> => {
  const appRef = doc(db, APPLICATIONS_COLLECTION, id);
  const appDoc = await getDoc(appRef);

  if (!appDoc.exists()) return null;

  const data = appDoc.data() as JobApplication;

  console.log('[updateApplication] Requestor:', requestorId);
  console.log('[updateApplication] App Owner:', data.userId);
  console.log('[updateApplication] App Recruiter:', data.recruiterId);

  // Business rules:
  // 1. Candidates cannot modify applications after sending (status != TO_APPLY)
  // 2. Recruiters can only change status from INTERVIEW to ACCEPTED or REFUSED
  // 3. Once ACCEPTED or REFUSED, status cannot be changed
  
  let hasPermission = false;
  let isApplicant = false;
  let isRecruiter = false;

  if (data.userId === requestorId) {
    isApplicant = true;
    // Candidates can only modify if status is TO_APPLY (not sent yet)
    if (data.status === ApplicationStatus.TO_APPLY) {
      hasPermission = true;
    } else {
      throw new Error('Vous ne pouvez pas modifier une candidature déjà envoyée');
    }
  } else if (data.recruiterId === requestorId) {
    isRecruiter = true;
    hasPermission = true;
  } else {
    // FALLBACK: Check if user owns the Job (handle legacy data where recruiterId missing on App)
    if (data.jobId) {
      const jobRef = doc(db, 'jobs', data.jobId);
      const jobDoc = await getDoc(jobRef);
      if (jobDoc.exists()) {
        const jobData = jobDoc.data();
        if (jobData.recruiterId === requestorId) {
          hasPermission = true;
          updates.recruiterId = requestorId;
          if (typeof window !== 'undefined') window.alert("Auto-fixed Recruiter ID!");
        } else {
          if (typeof window !== 'undefined') window.alert(`Job Recruiter Mismatch: Job(${jobData.recruiterId}) vs Requestor(${requestorId})`);
        }
      } else {
        if (typeof window !== 'undefined') window.alert(`Job not found: ${data.jobId}`);
      }
    } else {
      if (typeof window !== 'undefined') window.alert("Application has no Job ID");
    }
  }

  if (!hasPermission) {
    console.warn('[updateApplication] Permission denied');
    return null;
  }

  // If recruiter is updating status, enforce business rules
  if (isRecruiter && updates.status) {
    // Cannot change status if already ACCEPTED or REFUSED
    if (data.status === ApplicationStatus.ACCEPTED || data.status === ApplicationStatus.REFUSED) {
      throw new Error('Le statut ne peut pas être modifié une fois accepté ou refusé');
    }
    
    // Can only change to ACCEPTED or REFUSED if current status is INTERVIEW
    if (updates.status === ApplicationStatus.ACCEPTED || updates.status === ApplicationStatus.REFUSED) {
      if (data.status !== ApplicationStatus.INTERVIEW) {
        throw new Error('Vous ne pouvez changer le statut en "Acceptée" ou "Refusée" que depuis "Entretien"');
      }
    }
  }

  const now = new Date().toISOString();
  // Remove undefined fields before sending to Firestore
  const cleanedUpdates = removeUndefinedFields({
    ...updates,
    updatedAt: now,
  });
  
  await updateDoc(appRef, cleanedUpdates);

  return await getApplicationById(id, requestorId);
};

export const deleteApplication = async (id: string, userId: string): Promise<boolean> => {
  const appRef = doc(db, APPLICATIONS_COLLECTION, id);
  const appDoc = await getDoc(appRef);

  if (!appDoc.exists() || appDoc.data().userId !== userId) return false;

  await deleteDoc(appRef);
  return true;
};

// Force update for Recruiters (Bypass standard flow to fix legacy data)
export const forceUpdateApplicationStatus = async (
  id: string,
  status: string,
  requestorId: string
): Promise<boolean> => {
  try {
    const appRef = doc(db, APPLICATIONS_COLLECTION, id);
    const appDoc = await getDoc(appRef);

    if (!appDoc.exists()) {
      console.error('App not found');
      return false;
    }

    const data = appDoc.data() as JobApplication;
    let allowed = false;
    let shouldPatchRecruiterId = false;

    // Check direct permission
    if (data.recruiterId === requestorId) {
      allowed = true;
    }
    // Check job ownership
    else if (data.jobId) {
      const jobRef = doc(db, 'jobs', data.jobId);
      const jobDoc = await getDoc(jobRef);
      if (jobDoc.exists() && jobDoc.data().recruiterId === requestorId) {
        allowed = true;
        shouldPatchRecruiterId = true;
      }
    }

    if (!allowed) {
      if (typeof window !== 'undefined') window.alert("Permission Denied (Force Update)");
      return false;
    }

    const updates: any = {
      status: status,
      updatedAt: new Date().toISOString()
    };

    if (shouldPatchRecruiterId) {
      updates.recruiterId = requestorId;
    }

    // Remove undefined fields before sending to Firestore
    const cleanedUpdates = removeUndefinedFields(updates);
    await updateDoc(appRef, cleanedUpdates);
    return true;
  } catch (error) {
    console.error('Force Update Error:', error);
    if (typeof window !== 'undefined') window.alert("Force Update Exception: " + error);
    return false;
  }
};

// Search (Firestore basic search)
export const searchApplications = async (
  userId: string,
  queryString: string
): Promise<JobApplication[]> => {
  const apps = await getAllApplications(userId);
  const lowerQuery = queryString.toLowerCase();
  return apps.filter(app =>
    app.title.toLowerCase().includes(lowerQuery) ||
    app.company.toLowerCase().includes(lowerQuery)
  );
};

// Recruiter functions
export const getApplicationsByRecruiter = async (recruiterId: string): Promise<JobApplication[]> => {
  const appsRef = collection(db, APPLICATIONS_COLLECTION);
  // Remove orderBy to avoid composite index requirement
  const q = query(
    appsRef,
    where('recruiterId', '==', recruiterId)
  );

  const querySnapshot = await getDocs(q);
  const apps = querySnapshot.docs.map(doc => doc.data() as JobApplication);

  // In-memory sort
  return apps.sort((a, b) =>
    new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
  );
};

// Admin functions
export const getAllApplicationsAdmin = async (): Promise<JobApplication[]> => {
  const appsRef = collection(db, APPLICATIONS_COLLECTION);
  const q = query(appsRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as JobApplication);
};

export const filterApplications = async (
  userId: string,
  filters: {
    status?: string;
    contractType?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<JobApplication[]> => {
  // Use existing getAllApplications and filter in-memory to safely handle complex filters without composite indexes
  const apps = await getAllApplications(userId);

  return apps.filter(app => {
    let matches = true;

    if (filters.status && app.status !== filters.status) {
      matches = false;
    }

    if (filters.contractType && app.contractType !== filters.contractType) {
      matches = false;
    }

    if (filters.startDate && app.applicationDate < filters.startDate) {
      matches = false;
    }

    if (filters.endDate && app.applicationDate > filters.endDate) {
      matches = false;
    }

    return matches;
  });
};
