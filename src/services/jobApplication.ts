import {
  getAllApplications,
  getApplicationById as dbGetApplicationById,
  createApplication as dbCreateApplication,
  updateApplication as dbUpdateApplication,
  deleteApplication as dbDeleteApplication,
  searchApplications,
  filterApplications as dbFilterApplications,
  getApplicationsByRecruiter as dbGetApplicationsByRecruiter,
  hasUserAppliedToJob as dbHasUserAppliedToJob,
} from './database';
import { JobApplication, ApplicationFilters, ApplicationStats, ApplicationStatus } from '@/types/jobApplication';

// Récupérer toutes les candidatures d'un utilisateur
export const getApplications = async (userId: string): Promise<JobApplication[]> => {
  return await getAllApplications(userId);
};

// Récupérer une candidature par ID
export const getApplicationById = async (id: string, userId: string): Promise<JobApplication | null> => {
  return await dbGetApplicationById(id, userId);
};

// Récupérer les candidatures reçues par un recruteur
export const getApplicationsByRecruiter = async (recruiterId: string): Promise<JobApplication[]> => {
  return await dbGetApplicationsByRecruiter(recruiterId);
};

// Vérifier si un utilisateur a déjà postulé à une offre
export const hasUserAppliedToJob = async (userId: string, jobId: string): Promise<boolean> => {
  return await dbHasUserAppliedToJob(userId, jobId);
};

// Ajouter une nouvelle candidature
export const createApplication = async (application: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>): Promise<JobApplication> => {
  return await dbCreateApplication(application);
};

// Modifier une candidature
export const updateApplication = async (
  id: string,
  updates: Partial<JobApplication>,
  requestorId: string,
  changedBy?: string // Pour l'historique (userId ou recruiterId)
): Promise<JobApplication | null> => {
  // Si le statut change, enregistrer dans l'historique
  if (updates.status) {
    const { addApplicationHistory } = await import('./applicationHistory');
    // We need to fetch the existing application to check status change
    // We can use dbGetApplicationById but it needs requestorId
    const existing = await dbGetApplicationById(id, requestorId);

    if (existing && existing.status !== updates.status) {
      await addApplicationHistory(
        id,
        existing.status,
        updates.status,
        changedBy || requestorId
      );
    }
  }

  return await dbUpdateApplication(id, updates, requestorId);
};

export const forceUpdateStatus = async (id: string, status: string, requestorId: string) => {
  const { forceUpdateApplicationStatus } = await import('./database');
  return await forceUpdateApplicationStatus(id, status, requestorId);
};

// Supprimer une candidature
export const deleteApplication = async (id: string, userId: string): Promise<boolean> => {
  return await dbDeleteApplication(id, userId);
};

// Filtrer et rechercher des candidatures
export const filterApplications = async (
  userId: string,
  filters: ApplicationFilters
): Promise<JobApplication[]> => {
  // Si recherche texte, utiliser searchApplications
  if (filters.searchQuery) {
    const searchResults = await searchApplications(userId, filters.searchQuery);
    // Appliquer les autres filtres sur les résultats de recherche
    let filtered = searchResults;

    if (filters.status) {
      filtered = filtered.filter(app => app.status === filters.status);
    }
    if (filters.contractType) {
      filtered = filtered.filter(app => app.contractType === filters.contractType);
    }
    if (filters.startDate) {
      filtered = filtered.filter(app => app.applicationDate >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(app => app.applicationDate <= filters.endDate!);
    }
    return filtered;
  }

  // Sinon utiliser dbFilterApplications
  return await dbFilterApplications(userId, {
    status: filters.status,
    contractType: filters.contractType,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });
};

// Calculer les statistiques
export const getApplicationStats = async (userId: string): Promise<ApplicationStats> => {
  try {
    const applications = await getAllApplications(userId);
    const total = applications.length;

    // Répartition par statut
    const byStatus: Record<ApplicationStatus, number> = {
      [ApplicationStatus.TO_APPLY]: 0,
      [ApplicationStatus.SENT]: 0,
      [ApplicationStatus.INTERVIEW]: 0,
      [ApplicationStatus.REFUSED]: 0,
      [ApplicationStatus.ACCEPTED]: 0,
    };

    applications.forEach(app => {
      byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    });

    // Nombre d'entretiens
    const interviews = byStatus[ApplicationStatus.INTERVIEW] + byStatus[ApplicationStatus.ACCEPTED];

    // Taux de réussite (acceptées / total envoyées)
    const sent = byStatus[ApplicationStatus.SENT] + byStatus[ApplicationStatus.INTERVIEW] +
      byStatus[ApplicationStatus.ACCEPTED] + byStatus[ApplicationStatus.REFUSED];
    const successRate = sent > 0 ? (byStatus[ApplicationStatus.ACCEPTED] / sent) * 100 : 0;

    // Évolution dans le temps (groupé par mois)
    const evolutionMap = new Map<string, number>();
    applications.forEach(app => {
      const date = new Date(app.applicationDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      evolutionMap.set(monthKey, (evolutionMap.get(monthKey) || 0) + 1);
    });

    const evolution = Array.from(evolutionMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total,
      byStatus,
      interviews,
      successRate: Math.round(successRate * 100) / 100,
      evolution,
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      total: 0,
      byStatus: {
        [ApplicationStatus.TO_APPLY]: 0,
        [ApplicationStatus.SENT]: 0,
        [ApplicationStatus.INTERVIEW]: 0,
        [ApplicationStatus.REFUSED]: 0,
        [ApplicationStatus.ACCEPTED]: 0,
      },
      interviews: 0,
      successRate: 0,
      evolution: [],
    };
  }
};
