import { Application } from '../types';
import { saveApplication, getApplications, getApplicationsByJobId as getStoredApplicationsByJobId } from './storageService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.jobtracker.app';

export const submitApplication = async (
  application: Omit<Application, 'id' | 'submittedDate' | 'status'>
): Promise<Application> => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...application,
        submittedDate: new Date().toISOString(),
        status: 'pending',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit application: ${response.statusText}`);
    }

    const data = await response.json();
    await saveApplication(data);
    return data;
  } catch (error) {
    console.warn('API not available, simulating submission:', error);
    const localApplication: Application = {
      ...application,
      id: `app_${Date.now()}`,
      submittedDate: new Date().toISOString(),
      status: 'pending' as const,
    };
    await saveApplication(localApplication);
    return localApplication;
  }
};

export const getApplicationsByJobId = async (jobId: string): Promise<Application[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications?jobId=${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch applications: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('API not available, using local storage:', error);
    return await getStoredApplicationsByJobId(jobId);
  }
};

export const getAllApplications = async (): Promise<Application[]> => {
  return await getApplications();
};

export const getApplicationById = async (applicationId: string): Promise<Application | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch application: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('API not available:', error);
    return null;
  }
};
