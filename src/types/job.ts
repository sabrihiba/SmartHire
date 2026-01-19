// Types pour les offres d'emploi (job listings)

export enum JobType {
  FULL_TIME = 'Temps plein',
  PART_TIME = 'Temps partiel',
  CONTRACT = 'Contrat',
  INTERNSHIP = 'Stage',
  FREELANCE = 'Freelance',
  TEMPORARY = 'Temporaire',
}

export interface Job {
  id: string;
  title: string; // Titre du poste
  company: string; // Entreprise
  location: string; // Lieu
  type: JobType; // Type d'emploi
  description?: string; // Description du poste
  salary?: string; // Salaire (ex: "50k-70k €")
  jobUrl?: string; // Lien vers l'annonce
  postedDate: string; // Date de publication (ISO string)
  source?: string; // Source de l'annonce (ex: "LinkedIn", "Indeed")
  remote?: boolean; // Télétravail possible
  requirements?: string[]; // Liste des compétences requises
  benefits?: string[]; // Liste des avantages
  applicationDeadline?: string; // Date limite de candidature (ISO string)
  recruiterId?: string; // ID du recruteur qui a créé l'offre
  archived?: boolean; // Offre archivée
  createdAt?: string; // Date de création
  updatedAt?: string; // Date de mise à jour
}

export interface JobFilters {
  searchQuery?: string; // Recherche par titre/entreprise
  location?: string; // Filtre par lieu
  type?: JobType; // Filtre par type
  remote?: boolean; // Filtre télétravail
  minSalary?: number; // Salaire minimum
  source?: string; // Filtre par source
}

export interface JobSearchParams extends JobFilters {
  page?: number; // Pagination
  limit?: number; // Nombre de résultats par page
}

