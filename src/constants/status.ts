import { ApplicationStatus } from '@/types/jobApplication';
import { Colors } from './colors';

export const StatusConfig: Record<ApplicationStatus, { label: string; color: string }> = {
  [ApplicationStatus.TO_APPLY]: {
    label: 'À postuler',
    color: Colors.warning,
  },
  [ApplicationStatus.SENT]: {
    label: 'Envoyée',
    color: Colors.primary,
  },
  [ApplicationStatus.INTERVIEW]: {
    label: 'Entretien',
    color: Colors.secondary,
  },
  [ApplicationStatus.REFUSED]: {
    label: 'Refus',
    color: Colors.error,
  },
  [ApplicationStatus.ACCEPTED]: {
    label: 'Acceptée',
    color: Colors.success,
  },
};

export const ContractTypeLabels: Record<string, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  STAGE: 'Stage',
  ALTERNANCE: 'Alternance',
  FREELANCE: 'Freelance',
  INTERIM: 'Intérim',
  OTHER: 'Autre',
};

