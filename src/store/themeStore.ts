import { create } from 'zustand';
import { lightTheme, darkTheme, Theme } from '@/constants/theme';
import { Platform } from 'react-native';

interface ThemeStore {
  isDark: boolean;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

// Fonction pour appliquer la classe dark sur le root element (web uniquement)
const applyDarkClass = (isDark: boolean) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: false,
  theme: lightTheme,
  toggleTheme: () =>
    set((state) => {
      const newIsDark = !state.isDark;
      applyDarkClass(newIsDark);
      return {
        isDark: newIsDark,
        theme: newIsDark ? darkTheme : lightTheme,
      };
    }),
  setTheme: (isDark: boolean) => {
    applyDarkClass(isDark);
    set({
      isDark,
      theme: isDark ? darkTheme : lightTheme,
    });
  },
}));

