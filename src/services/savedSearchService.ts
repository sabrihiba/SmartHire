import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedSearch } from '@/types/savedSearch';

const SAVED_SEARCHES_KEY = '@saved_searches';

// Créer une recherche sauvegardée
export const saveSearch = async (search: Omit<SavedSearch, 'id' | 'createdAt'>): Promise<SavedSearch> => {
  try {
    const data = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
    const searches: SavedSearch[] = data ? JSON.parse(data) : [];

    const newSearch: SavedSearch = {
      ...search,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };

    searches.push(newSearch);
    await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
    return newSearch;
  } catch (error) {
    console.error('Error saving search:', error);
    throw error;
  }
};

// Récupérer les recherches sauvegardées d'un utilisateur
export const getSavedSearches = async (userId: string): Promise<SavedSearch[]> => {
  try {
    const data = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
    if (!data) return [];

    const searches: SavedSearch[] = JSON.parse(data);
    return searches
      .filter(s => s.userId === userId)
      .sort((a, b) => {
        const dateA = new Date(b.lastUsed || b.createdAt).getTime();
        const dateB = new Date(a.lastUsed || a.createdAt).getTime();
        return dateA - dateB;
      });
  } catch (error) {
    console.error('Error getting saved searches:', error);
    return [];
  }
};

// Mettre à jour une recherche sauvegardée
export const updateSavedSearch = async (
  id: string,
  updates: Partial<SavedSearch>
): Promise<SavedSearch | null> => {
  try {
    const data = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
    if (!data) return null;

    const searches: SavedSearch[] = JSON.parse(data);
    const index = searches.findIndex(s => s.id === id);
    
    if (index === -1) return null;

    searches[index] = {
      ...searches[index],
      ...updates,
      lastUsed: new Date().toISOString(),
    };

    await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
    return searches[index];
  } catch (error) {
    console.error('Error updating saved search:', error);
    throw error;
  }
};

// Supprimer une recherche sauvegardée
export const deleteSavedSearch = async (id: string): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem(SAVED_SEARCHES_KEY);
    if (!data) return false;

    const searches: SavedSearch[] = JSON.parse(data);
    const filtered = searches.filter(s => s.id !== id);

    if (filtered.length === searches.length) return false;

    await AsyncStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting saved search:', error);
    throw error;
  }
};

