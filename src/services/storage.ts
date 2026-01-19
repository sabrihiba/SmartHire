import { Platform } from 'react-native';

const TOKEN_KEY = 'authToken';

// Sur web, utiliser localStorage directement
// Sur mobile, utiliser expo-secure-store
let SecureStore: any = null;

if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (error) {
    console.warn('expo-secure-store not available, falling back to localStorage');
  }
}

export const saveToken = async (token: string) => {
  try {
    if (Platform.OS === 'web') {
      // Sur web, utiliser localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } else if (SecureStore) {
      // Sur mobile, utiliser SecureStore
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      // Fallback si SecureStore n'est pas disponible
      console.warn('SecureStore not available, token not saved securely');
    }
  } catch (error) {
    console.error('Error saving token:', error);
    // Fallback vers localStorage si erreur
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }
};

export const getToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      // Sur web, utiliser localStorage
      if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return null;
    } else if (SecureStore) {
      // Sur mobile, utiliser SecureStore
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } else {
      // Fallback si SecureStore n'est pas disponible
      if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
      }
      return null;
    }
  } catch (error) {
    console.error('Error getting token:', error);
    // Fallback vers localStorage si erreur
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  }
};

export const deleteToken = async () => {
  try {
    if (Platform.OS === 'web') {
      // Sur web, utiliser localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
      }
    } else if (SecureStore) {
      // Sur mobile, utiliser SecureStore
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
      // Fallback si SecureStore n'est pas disponible
      if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  } catch (error) {
    console.error('Error deleting token:', error);
    // Fallback vers localStorage si erreur
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};

