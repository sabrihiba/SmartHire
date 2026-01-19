import { useAuth } from './useAuth';
import { UserRole } from '@/types';

export const usePermissions = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === UserRole.ADMIN;
  const isRecruiter = user?.role === UserRole.RECRUITER;
  const isCandidate = user?.role === UserRole.CANDIDATE;

  const canCreateJob = isAdmin || isRecruiter;
  const canCreateApplication = isCandidate;
  const canManageApplications = isAdmin || isRecruiter;
  const canViewAllApplications = isAdmin || isRecruiter;

  // Permissions Admin
  const canManageUsers = isAdmin;
  const canViewAllJobs = isAdmin;
  const canModifyAnyJob = isAdmin;
  const canModifyAnyApplication = isAdmin;
  const canDeleteAnyJob = isAdmin;
  const canDeleteAnyApplication = isAdmin;

  return {
    isAdmin,
    isRecruiter,
    isCandidate,
    canCreateJob,
    canCreateApplication,
    canManageApplications,
    canViewAllApplications,
    canManageUsers,
    canViewAllJobs,
    canModifyAnyJob,
    canModifyAnyApplication,
    canDeleteAnyJob,
    canDeleteAnyApplication,
  };
};

