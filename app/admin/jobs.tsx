import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getAllJobs, deleteJob, hasApplications } from '@/services/jobService';
import { Job } from '@/types/job';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function AdminJobsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, canViewAllJobs, canDeleteAnyJob } = usePermissions();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAdmin || !canViewAllJobs) {
      Alert.alert('Accès refusé', 'Seuls les administrateurs peuvent voir toutes les offres.');
      router.back();
    }
  }, [isAdmin, canViewAllJobs]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllJobs();
      setJobs(data);
    } catch (error) {
      console.error('Error loading jobs:', error);
      Alert.alert('Erreur', 'Impossible de charger les offres');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const handleDelete = async (job: Job) => {
    // Vérifier si l'offre a des candidatures
    const hasApps = await hasApplications(job.id);
    
    if (hasApps) {
      Alert.alert(
        'Impossible de supprimer',
        'Cette offre a des candidatures en cours. Vous ne pouvez pas la supprimer.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Supprimer l\'offre',
      `Êtes-vous sûr de vouloir supprimer l'offre "${job.title}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Admin peut supprimer n'importe quelle offre
              const success = await deleteJob(job.id, job.recruiterId);
              if (success) {
                Alert.alert('Succès', 'Offre supprimée avec succès');
                loadJobs();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer l\'offre');
              }
            } catch (error) {
              console.error('Error deleting job:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const renderJobItem = ({ item }: { item: Job }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-medium active:scale-[0.98]"
      onPress={() => router.push(`/job/${item.id}`)}
      activeOpacity={0.8}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-lg font-bold text-gray-900 mb-1">{item.title}</Text>
          <Text className="text-base text-gray-600 mb-2">{item.company}</Text>
          <View className="flex-row items-center">
            <Feather name="map-pin" size={14} color="#9CA3AF" />
            <Text className="text-sm text-gray-500 ml-1.5">{item.location}</Text>
          </View>
        </View>
        {canDeleteAnyJob && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
            className="bg-red-50 p-2 rounded-full active:bg-red-100"
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <Feather name="calendar" size={12} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-1.5">
            Publié le {new Date(item.postedDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            router.push(`/job/${item.id}/edit`);
          }}
          className="bg-primary-50 px-3 py-1.5 rounded-full active:bg-primary-100"
        >
          <Text className="text-primary-600 text-xs font-bold">Modifier</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Gestion des offres' }} />
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Feather name="briefcase" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-base text-gray-500">
              Aucune offre d'emploi
            </Text>
          </View>
        }
      />
    </View>
  );
}

