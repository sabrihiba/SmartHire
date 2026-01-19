import AsyncStorage from '@react-native-async-storage/async-storage';
import { Application } from '../types';

const APPLICATIONS_KEY = '@job_tracker_applications';

export const saveApplication = async (application: Application): Promise<void> => {
  try {
    const existing = await getApplications();
    const updated = [...existing, application];
    await AsyncStorage.setItem(APPLICATIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving application:', error);
    throw error;
  }
};

/**
 * Get all saved applications
 */
export const getApplications = async (): Promise<Application[]> => {
  try {
    const data = await AsyncStorage.getItem(APPLICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting applications:', error);
    return [];
  }
};

export const getApplicationsByJobId = async (jobId: string): Promise<Application[]> => {
  try {
    const all = await getApplications();
    return all.filter((app) => app.jobId === jobId);
  } catch (error) {
    console.error('Error getting applications by job ID:', error);
    return [];
  }
};

export const deleteApplication = async (applicationId: string): Promise<void> => {
  try {
    const all = await getApplications();
    const filtered = all.filter((app) => app.id !== applicationId);
    await AsyncStorage.setItem(APPLICATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting application:', error);
    throw error;
  }
};
