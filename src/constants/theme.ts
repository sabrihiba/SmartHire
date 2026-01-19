// Palette de couleurs bleue/grise selon le cahier des charges

export const lightTheme = {
  colors: {
    primary: '#2563EB', // Bleu principal
    secondary: '#64748B', // Gris bleu
    accent: '#3B82F6', // Bleu accent
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    card: '#FFFFFF',
  },
};

export const darkTheme = {
  colors: {
    primary: '#3B82F6',
    secondary: '#94A3B8',
    accent: '#60A5FA',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    border: '#334155',
    card: '#1E293B',
  },
};

export type Theme = typeof lightTheme;

