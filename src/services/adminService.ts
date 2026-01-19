import { db } from '@/config/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { User, UserRole } from '@/types';

// Récupérer tous les utilisateurs (Admin uniquement)
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as User);
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
};

// Mettre à jour le rôle d'un utilisateur (Admin uniquement)
export const updateUserRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Supprimer un utilisateur (Admin uniquement)
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Statistiques globales pour Admin
export interface AdminStats {
  totalUsers: number;
  totalRecruiters: number;
  totalCandidates: number;
  totalJobs: number;
  totalApplications: number;
  usersByRole: Record<UserRole, number>;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const [users, jobs, applications] = await Promise.all([
      getAllUsers(),
      import('./jobService').then(m => m.getAllJobs()),
      import('./database').then(m => m.getAllApplicationsAdmin()),
    ]);

    const usersByRole: Record<UserRole, number> = {
      [UserRole.ADMIN]: 0,
      [UserRole.RECRUITER]: 0,
      [UserRole.CANDIDATE]: 0,
    };

    users.forEach(user => {
      usersByRole[user.role] = (usersByRole[user.role] || 0) + 1;
    });

    return {
      totalUsers: users.length,
      totalRecruiters: usersByRole[UserRole.RECRUITER],
      totalCandidates: usersByRole[UserRole.CANDIDATE],
      totalJobs: jobs.length,
      totalApplications: applications.length,
      usersByRole,
    };
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalUsers: 0,
      totalRecruiters: 0,
      totalCandidates: 0,
      totalJobs: 0,
      totalApplications: 0,
      usersByRole: {
        [UserRole.ADMIN]: 0,
        [UserRole.RECRUITER]: 0,
        [UserRole.CANDIDATE]: 0,
      },
    };
  }
};
