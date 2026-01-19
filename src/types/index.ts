export enum UserRole {
  ADMIN = 'ADMIN',
  RECRUITER = 'RECRUITER',
  CANDIDATE = 'CANDIDATE',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary?: string;
  description: string;
  requirements: string[];
  benefits?: string[];
  postedDate: string;
  applicationDeadline?: string;
  remote?: boolean;
}

export interface Application {
  id?: string;
  jobId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  resume?: string;
  coverLetter?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  submittedDate?: string;
  status?: 'pending' | 'reviewing' | 'accepted' | 'rejected';
}
