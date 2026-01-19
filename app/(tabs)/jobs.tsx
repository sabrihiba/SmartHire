import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { JobList } from '@/components/JobList';
import { fetchJobs, searchJobs } from '@/services/job';
import { getAllJobs, getJobsByRecruiter } from '@/services/jobService';
import { saveSearch, getSavedSearches, deleteSavedSearch, updateSavedSearch } from '@/services/savedSearchService';
import { Job, JobFilters, JobType } from '@/types/job';
import { SavedSearch } from '@/types/savedSearch';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

const JobTypeLabels: Record<JobType, string> = {
  [JobType.FULL_TIME]: 'Temps plein',
  [JobType.PART_TIME]: 'Temps partiel',
  [JobType.CONTRACT]: 'Contrat',
  [JobType.INTERNSHIP]: 'Stage',
  [JobType.FREELANCE]: 'Freelance',
  [JobType.TEMPORARY]: 'Temporaire',
};

export default function JobsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ refresh?: string }>();
  const { user } = useAuth();
  const { isRecruiter } = usePermissions();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<JobFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSavedSearches, setShowSavedSearches] = useState(false);

  // Load jobs on mount and when refresh param changes (after creating a new job)
  useEffect(() => {
    loadJobs();
  }, [isRecruiter, user?.id, params.refresh]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        loadJobs();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, filters]);

  const loadSavedSearches = async () => {
    if (!user?.id) return;
    try {
      const searches = await getSavedSearches(user.id);
      setSavedSearches(searches);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  useEffect(() => {
    if (!isRecruiter && user?.id) {
      loadSavedSearches();
    }
  }, [isRecruiter, user?.id]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      if (isRecruiter && user?.id) {
        // Pour les recruteurs, afficher uniquement leurs offres
        const recruiterJobs = await getJobsByRecruiter(user.id).catch(() => []);
        setJobs(recruiterJobs);
      } else {
        // Pour les postulants, afficher toutes les offres disponibles
        const [mockJobs, recruiterJobs] = await Promise.all([
          fetchJobs({
            ...filters,
            limit: 50,
          }).catch(() => []),
          getAllJobs().catch(() => []),
        ]);
        // Combiner et dédupliquer par ID
        const allJobs = [...mockJobs, ...recruiterJobs];
        const uniqueJobs = allJobs.filter((job, index, self) =>
          index === self.findIndex(j => j.id === job.id)
        );
        setJobs(uniqueJobs);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les offres d\'emploi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      const data = await searchJobs(searchQuery, filters);
      setJobs(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rechercher les offres d\'emploi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobPress = (job: Job) => {
    // Naviguer vers l'écran de détails du job
    router.push(`/job/${job.id}`);
  };

  const toggleFilter = (key: keyof JobFilters, value: any) => {
    setFilters(prev => {
      if (prev[key] === value) {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un emploi, une entreprise..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Feather name="x" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Feather
            name="filter"
            size={20}
            color={showFilters ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>
        {!isRecruiter && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowSavedSearches(!showSavedSearches)}
          >
            <Feather
              name="bookmark"
              size={20}
              color={showSavedSearches ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Saved Searches Panel */}
      {showSavedSearches && !isRecruiter && (
        <View style={styles.filtersPanel}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Recherches sauvegardées</Text>
            <TouchableOpacity
              onPress={async () => {
                if (!user?.id) return;
                try {
                  Alert.prompt(
                    'Nom de la recherche',
                    'Donnez un nom à cette recherche',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      {
                        text: 'Sauvegarder',
                        onPress: async (name: string) => {
                          if (name) {
                            await saveSearch({
                              userId: user.id,
                              name,
                              searchQuery,
                              filters,
                              alertEnabled: false,
                            });
                            await loadSavedSearches();
                            Alert.alert('Succès', 'Recherche sauvegardée');
                          }
                        },
                      },
                    ],
                    'plain-text'
                  );
                } catch (error) {
                  Alert.alert('Erreur', 'Impossible de sauvegarder la recherche');
                }
              }}
            >
              <Feather name="plus" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {savedSearches.length === 0 ? (
              <Text style={styles.emptyText}>Aucune recherche sauvegardée</Text>
            ) : (
              savedSearches.map((search) => (
                <View key={search.id} style={styles.savedSearchItem}>
                  <TouchableOpacity
                    style={styles.savedSearchContent}
                    onPress={async () => {
                      setSearchQuery(search.searchQuery || '');
                      setFilters({ ...search.filters, type: search.filters.type as JobType | undefined });
                      await updateSavedSearch(search.id, {});
                      setShowSavedSearches(false);
                    }}
                  >
                    <Feather name="search" size={16} color={Colors.primary} />
                    <View style={styles.savedSearchInfo}>
                      <Text style={styles.savedSearchName}>{search.name}</Text>
                      <Text style={styles.savedSearchDetails} numberOfLines={1}>
                        {search.searchQuery || 'Aucun terme'} • {Object.keys(search.filters).length} filtre(s)
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      Alert.alert(
                        'Supprimer',
                        `Voulez-vous supprimer "${search.name}" ?`,
                        [
                          { text: 'Annuler', style: 'cancel' },
                          {
                            text: 'Supprimer',
                            style: 'destructive',
                            onPress: async () => {
                              await deleteSavedSearch(search.id);
                              await loadSavedSearches();
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <Feather name="trash-2" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {/* Location Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Lieu</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Paris, Lyon..."
                placeholderTextColor={Colors.textSecondary}
                value={filters.location || ''}
                onChangeText={(text) => toggleFilter('location', text || undefined)}
              />
            </View>

            {/* Remote Filter */}
            <TouchableOpacity
              style={[
                styles.filterChip,
                filters.remote && styles.filterChipActive,
              ]}
              onPress={() => toggleFilter('remote', !filters.remote)}
            >
              <Feather
                name="home"
                size={14}
                color={filters.remote ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  filters.remote && styles.filterChipTextActive,
                ]}
              >
                Télétravail
              </Text>
            </TouchableOpacity>

            {/* Job Type Filters */}
            {Object.values(JobType).map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  filters.type === type && styles.filterChipActive,
                ]}
                onPress={() => toggleFilter('type', filters.type === type ? undefined : type)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.type === type && styles.filterChipTextActive,
                  ]}
                >
                  {JobTypeLabels[type]}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={clearFilters}
              >
                <Feather name="x-circle" size={16} color={Colors.error} />
                <Text style={styles.clearFiltersText}>Effacer</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && !showFilters && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersText}>
            {Object.keys(filters).length} filtre(s) actif(s)
          </Text>
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearFiltersLink}>Effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Jobs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des offres...</Text>
        </View>
      ) : (
        <JobList
          jobs={jobs}
          onJobPress={handleJobPress}
          emptyMessage={
            searchQuery.trim()
              ? 'Aucune offre ne correspond à votre recherche'
              : 'Aucune offre d\'emploi disponible'
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  filtersPanel: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  filtersScroll: {
    paddingHorizontal: 16,
  },
  filterSection: {
    marginRight: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  filterInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
    minWidth: 120,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.error + '20',
    borderWidth: 1,
    borderColor: Colors.error,
    marginRight: 8,
    gap: 6,
  },
  clearFiltersText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },
  activeFiltersBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activeFiltersText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  clearFiltersLink: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    padding: 20,
  },
  savedSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  savedSearchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedSearchInfo: {
    flex: 1,
  },
  savedSearchName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  savedSearchDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

