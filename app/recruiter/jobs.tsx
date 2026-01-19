import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getJobsByRecruiter, deleteJob, hasApplications, toggleJobArchive } from '@/services/jobService';
import { getApplicationsByRecruiter } from '@/services/jobApplication';
import { Job } from '@/types/job';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function RecruiterJobsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { canCreateJob } = usePermissions();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (!canCreateJob) {
      Alert.alert('Accès refusé', 'Seuls les recruteurs peuvent voir leurs offres.');
      router.back();
    }
  }, [canCreateJob]);

  const loadJobs = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getJobsByRecruiter(user.id);
      // Enrichir avec le nombre de candidatures pour chaque offre
      const jobsWithStats = await Promise.all(
        data.map(async (job) => {
          const applications = await getApplicationsByRecruiter(user.id);
          const jobApplications = applications.filter(app => app.jobId === job.id);
          return {
            ...job,
            applicationCount: jobApplications.length,
          };
        })
      );
      // Filtrer selon showArchived
      const filtered = showArchived
        ? jobsWithStats
        : jobsWithStats.filter(job => !job.archived);

      // Sort: Most recent first
      const sorted = filtered.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());

      setJobs(sorted);
    } catch (error) {
      console.error('Error loading recruiter jobs:', error);
      Alert.alert('Erreur', 'Impossible de charger les offres.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, showArchived]);

  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [loadJobs])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  const handleJobPress = (job: Job) => {
    router.push(`/job/${job.id}`);
  };

  const handleDelete = async (job: Job, event: any) => {
    event?.stopPropagation();
    if (!user) return;

    const hasApps = await hasApplications(job.id);

    if (hasApps) {
      Alert.alert('Impossible de supprimer', 'Cette offre a des candidatures en cours.');
      return;
    }

    Alert.alert(
      'Supprimer',
      `Supprimer "${job.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteJob(job.id, user.id);
            loadJobs();
          },
        },
      ]
    );
  };

  const handleArchive = async (job: Job, event: any) => {
    event?.stopPropagation();
    if (!user) return;
    await toggleJobArchive(job.id, user.id, !job.archived);
    loadJobs();
  };

  const renderJobItem = ({ item }: { item: Job & { applicationCount?: number } }) => (
    <TouchableOpacity
      className={`bg-white rounded-3xl mb-4 shadow-sm border ${item.archived ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
        } active:scale-[0.99]`}
      onPress={() => handleJobPress(item)}
      activeOpacity={0.9}
      style={{
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }}
    >
      <View className="p-5">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1 mr-4">
            <View className="flex-row items-center mb-1">
              {item.archived && (
                <View className="bg-amber-100 px-2 py-0.5 rounded-md mr-2">
                  <Text className="text-amber-700 text-[10px] font-bold uppercase tracking-wider">Archivé</Text>
                </View>
              )}
              <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide">
                {new Date(item.postedDate).toLocaleDateString()}
              </Text>
            </View>
            <Text className="font-bold text-gray-900 text-xl leading-tight mb-1">{item.title}</Text>
            <Text className="text-primary-600 text-sm font-semibold">{item.company}</Text>
          </View>

          <View className={`items-center justify-center h-12 w-12 rounded-2xl ${(item.applicationCount || 0) > 0 ? 'bg-primary-50' : 'bg-gray-50'
            }`}>
            <Text className={`text-lg font-bold ${(item.applicationCount || 0) > 0 ? 'text-primary-600' : 'text-gray-400'
              }`}>
              {item.applicationCount || 0}
            </Text>
            <Text className={`text-[9px] font-medium ${(item.applicationCount || 0) > 0 ? 'text-primary-600' : 'text-gray-400'
              }`}>
              Candidats
            </Text>
          </View>
        </View>

        <View className="flex-row items-center mb-5">
          <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full mr-2">
            <Feather name="map-pin" size={12} color="#6B7280" />
            <Text className="text-gray-600 text-xs ml-1.5 font-medium">{item.location}</Text>
          </View>
          <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full">
            <Feather name="briefcase" size={12} color="#6B7280" />
            <Text className="text-gray-600 text-xs ml-1.5 font-medium">{item.type}</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between pt-4 border-t border-gray-100">
          {/* Primary Action */}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/recruiter/applications?jobId=${item.id}`);
            }}
            className="flex-row items-center"
          >
            <Text className="text-primary-600 font-bold text-sm mr-1">Gérer les candidatures</Text>
            <Feather name="arrow-right" size={16} color={Colors.primary} />
          </TouchableOpacity>

          {/* Icon Actions */}
          <View className="flex-row items-center gap-1">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                router.push(`/job/${item.id}/edit`);
              }}
              className="h-10 w-10 items-center justify-center rounded-full bg-blue-50 active:bg-blue-100"
            >
              <Feather name="edit-2" size={18} color="#2563EB" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => handleArchive(item, e)}
              className={`h-10 w-10 items-center justify-center rounded-full ${item.archived ? 'bg-amber-100' : 'bg-gray-100'
                }`}
            >
              <Feather
                name="archive"
                size={18}
                color={item.archived ? '#D97706' : '#4B5563'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={(e) => handleDelete(item, e)}
              className="h-10 w-10 items-center justify-center rounded-full bg-red-50 active:bg-red-100"
            >
              <Feather name="trash-2" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
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
      <Stack.Screen
        options={{
          title: 'Mes Offres',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#F9FAFB' },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/job/new')}
              className="bg-primary-500 h-8 w-8 items-center justify-center rounded-full shadow-sm"
            >
              <Feather name="plus" size={20} color="white" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Filter Header */}
      <View className="px-5 py-2 pb-4 bg-gray-50 z-10">
        <TouchableOpacity
          onPress={() => setShowArchived(!showArchived)}
          className={`flex-row items-center justify-between px-4 py-3 rounded-2xl border ${showArchived ? 'bg-primary-50 border-primary-100' : 'bg-white border-gray-200'
            }`}
        >
          <View className="flex-row items-center">
            <View className={`h-8 w-8 rounded-full items-center justify-center mr-3 ${showArchived ? 'bg-primary-100' : 'bg-gray-100'
              }`}>
              <Feather
                name={showArchived ? 'eye' : 'archive'}
                size={16}
                color={showArchived ? Colors.primary : '#6B7280'}
              />
            </View>
            <View>
              <Text className="text-sm font-bold text-gray-900">
                {showArchived ? 'Affichage : Tout' : 'Affichage : Actifs'}
              </Text>
              <Text className="text-xs text-gray-500">
                {showArchived ? 'Inclus les offres archivées' : 'Masque les offres archivées'}
              </Text>
            </View>
          </View>
          <Feather
            name={showArchived ? "toggle-right" : "toggle-left"}
            size={24}
            color={showArchived ? Colors.primary : "#9CA3AF"}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJobItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-20">
            <View className="h-24 w-24 bg-gray-100 rounded-full items-center justify-center mb-6">
              <Feather name="layers" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2">Aucune offre</Text>
            <Text className="text-gray-500 text-center px-10 mb-8 leading-6">
              Vous n'avez pas encore publié d'offres d'emploi. Commencez dès maintenant !
            </Text>
            <TouchableOpacity
              className="bg-primary-500 px-8 py-4 rounded-2xl shadow-lg shadow-primary-500/30"
              onPress={() => router.push('/job/new')}
            >
              <Text className="text-white font-bold text-lg">Créer une offre</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}
