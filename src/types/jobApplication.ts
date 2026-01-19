// Types pour la gestion des candidatures

export enum ApplicationStatus {
  TO_APPLY = 'À postuler',
  SENT = 'Envoyée',
  INTERVIEW = 'Entretien',
  REFUSED = 'Refus',
  ACCEPTED = 'Acceptée',
}

export enum ContractType {
  CDI = 'CDI',
  CDD = 'CDD',
  STAGE = 'Stage',
  ALTERNANCE = 'Alternance',
  FREELANCE = 'Freelance',
  INTERIM = 'Intérim',
  OTHER = 'Autre',
}

export interface ApplicationHistory {
  id: string;
  applicationId: string;
  oldStatus?: ApplicationStatus;
  newStatus: ApplicationStatus;
  changedBy: string; // userId ou recruiterId
  changedAt: string;
  notes?: string;
}

export interface JobApplication {
  id: string;
  title: string; // Titre du poste
  company: string; // Entreprise
  location: string; // Lieu
  jobUrl?: string; // Lien de l'annonce
  contractType: ContractType; // Type de contrat
  applicationDate: string; // Date de candidature (ISO string)
  status: ApplicationStatus; // Statut
  notes?: string; // Notes
  documents?: string[]; // Chemins vers documents joints (CV, lettre)
  cvUrl?: string; // URI du CV uploadé (file:// ou base64)
  cvFileName?: string; // Nom du fichier CV
  jobId?: string; // ID de l'offre d'emploi (si postulé depuis une offre)
  userId: string; // ID de l'utilisateur candidat
  recruiterId?: string; // ID du recruteur qui a créé l'offre
  lastFollowUp?: string; // Date de dernière relance (ISO string)
  followUpCount?: number; // Nombre de relances
  createdAt: string; // Date de création
  updatedAt: string; // Date de mise à jour
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  contractType?: ContractType;
  startDate?: string;
  endDate?: string;
  searchQuery?: string; // Recherche par titre/entreprise
}

export interface ApplicationStats {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
  interviews: number; // Nombre d'entretiens obtenus
  successRate: number; // Taux de réussite (%)
  evolution: {
    date: string;
    count: number;
  }[];
}

