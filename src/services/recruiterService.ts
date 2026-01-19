import { getJobsByRecruiter } from './jobService';
import { getApplicationsByRecruiter } from './jobApplication';
import { ApplicationStatus } from '@/types/jobApplication';

export interface RecruiterStats {
  totalJobs: number;
  totalApplications: number;
  pendingApplications: number;
  interviewApplications: number;
  acceptedApplications: number;
  refusedApplications: number;
}

export const getRecruiterStats = async (recruiterId: string): Promise<RecruiterStats> => {
  try {
    const [jobs, applications] = await Promise.all([
      getJobsByRecruiter(recruiterId),
      getApplicationsByRecruiter(recruiterId),
    ]);

    const totalJobs = jobs.length;
    const totalApplications = applications.length;
    const pendingApplications = applications.filter(
      app => app.status === ApplicationStatus.SENT || app.status === ApplicationStatus.TO_APPLY
    ).length;
    const interviewApplications = applications.filter(
      app => app.status === ApplicationStatus.INTERVIEW
    ).length;
    const acceptedApplications = applications.filter(
      app => app.status === ApplicationStatus.ACCEPTED
    ).length;
    const refusedApplications = applications.filter(
      app => app.status === ApplicationStatus.REFUSED
    ).length;

    return {
      totalJobs,
      totalApplications,
      pendingApplications,
      interviewApplications,
      acceptedApplications,
      refusedApplications,
    };
  } catch (error) {
    console.error('Error getting recruiter stats:', error);
    return {
      totalJobs: 0,
      totalApplications: 0,
      pendingApplications: 0,
      interviewApplications: 0,
      acceptedApplications: 0,
      refusedApplications: 0,
    };
  }
};

