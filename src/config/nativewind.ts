import { Platform } from 'react-native';

// Configuration NativeWind pour désactiver la détection automatique du dark mode
// Cette configuration doit être exécutée avant que NativeWind n'initialise le runtime
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  // Exécuter immédiatement pour configurer avant l'initialisation de NativeWind
  (async () => {
    try {
      const { StyleSheet } = await import('react-native-css-interop');
      // Configurer NativeWind pour utiliser le mode 'class' au lieu de 'media'
      StyleSheet.setFlag('darkMode', 'class');
    } catch (e) {
      // Ignorer si le module n'est pas disponible ou si déjà configuré
      console.warn('Could not configure NativeWind dark mode:', e);
    }
  })();
}
