import { Job, JobSearchParams, JobFilters, JobType } from '@/types/job';

// Base URL pour l'API de recherche d'emploi
// TODO: Remplacer par l'URL réelle de l'API de recherche d'emploi
const JOB_API_BASE_URL = process.env.EXPO_PUBLIC_JOB_API_URL || 'https://api.example.com/jobs';

// Mock data pour le développement (à remplacer par un appel API réel)
const MOCK_JOBS: Job[] = [];

/**
 * Récupère la liste des offres d'emploi
 * @param params Paramètres de recherche et filtres
 * @returns Liste des offres d'emploi
 */
export const fetchJobs = async (params?: JobSearchParams): Promise<Job[]> => {
  try {
    // TODO: Remplacer par un appel API réel
    // const response = await fetch(`${JOB_API_BASE_URL}?${new URLSearchParams(params as any)}`);
    // const data = await response.json();
    // return data.jobs;

    // Pour l'instant, utiliser les données mockées
    let jobs = [...MOCK_JOBS];

    // Appliquer les filtres
    if (params) {
      jobs = applyFilters(jobs, params);
    }

    // Pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return jobs.slice(startIndex, endIndex);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw new Error('Impossible de charger les offres d\'emploi');
  }
};

/**
 * Recherche d'offres d'emploi avec un terme de recherche
 * @param query Terme de recherche
 * @param filters Filtres additionnels
 * @returns Liste des offres d'emploi correspondantes
 */
export const searchJobs = async (
  query: string,
  filters?: JobFilters
): Promise<Job[]> => {
  try {
    // TODO: Remplacer par un appel API réel
    // const response = await fetch(`${JOB_API_BASE_URL}/search`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ query, ...filters }),
    // });
    // const data = await response.json();
    // return data.jobs;

    // Récupérer aussi les offres de la base de données
    const { getAllJobs } = await import('./jobService');
    const dbJobs = await getAllJobs().catch(() => []);

    // Combiner avec les offres mockées
    let allJobs = [...MOCK_JOBS, ...dbJobs];

    // Dédupliquer par ID
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j => j.id === job.id)
    );

    // Recherche par terme (titre, entreprise, lieu, description, compétences)
    if (query) {
      const lowerQuery = query.toLowerCase();
      allJobs = uniqueJobs.filter(
        job => {
          const matchesTitle = job.title.toLowerCase().includes(lowerQuery);
          const matchesCompany = job.company.toLowerCase().includes(lowerQuery);
          const matchesLocation = job.location.toLowerCase().includes(lowerQuery);
          const matchesDescription = job.description?.toLowerCase().includes(lowerQuery) || false;
          const matchesRequirements = job.requirements?.some(req =>
            req.toLowerCase().includes(lowerQuery)
          ) || false;
          const matchesSalary = job.salary?.toLowerCase().includes(lowerQuery) || false;

          return matchesTitle || matchesCompany || matchesLocation ||
            matchesDescription || matchesRequirements || matchesSalary;
        }
      );
    } else {
      allJobs = uniqueJobs;
    }

    // Appliquer les autres filtres
    if (filters) {
      allJobs = applyFilters(allJobs, filters);
    }

    return allJobs;
  } catch (error) {
    console.error('Error searching jobs:', error);
    throw new Error('Impossible de rechercher les offres d\'emploi');
  }
};

/**
 * Récupère une offre d'emploi par son ID
 * @param id ID de l'offre
 * @returns Offre d'emploi ou null
 */
export const getJobById = async (id: string): Promise<Job | null> => {
  try {
    // TODO: Remplacer par un appel API réel
    // const response = await fetch(`${JOB_API_BASE_URL}/${id}`);
    // const data = await response.json();
    // return data.job;

    // Pour l'instant, utiliser les données mockées
    const job = MOCK_JOBS.find(j => j.id === id);
    return job || null;
  } catch (error) {
    console.error('Error fetching job by id:', error);
    return null;
  }
};

/**
 * Applique les filtres à une liste d'offres d'emploi
 */
function applyFilters(jobs: Job[], filters: JobFilters): Job[] {
  let filtered = [...jobs];

  if (filters.location) {
    const lowerLocation = filters.location.toLowerCase();
    filtered = filtered.filter(job =>
      job.location.toLowerCase().includes(lowerLocation)
    );
  }

  if (filters.type) {
    filtered = filtered.filter(job => job.type === filters.type);
  }

  if (filters.remote !== undefined) {
    filtered = filtered.filter(job => job.remote === filters.remote);
  }

  if (filters.source) {
    filtered = filtered.filter(job => job.source === filters.source);
  }

  if (filters.minSalary) {
    filtered = filtered.filter(job => {
      if (!job.salary) return false;
      // Extraction approximative du salaire minimum depuis la chaîne
      const match = job.salary.match(/(\d+)k/);
      if (match) {
        const salary = parseInt(match[1]) * 1000;
        return salary >= filters.minSalary!;
      }
      return false;
    });
  }

  return filtered;
}

