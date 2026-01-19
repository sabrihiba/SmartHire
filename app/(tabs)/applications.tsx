import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import {
  getApplications,
  deleteApplication,
  filterApplications,
} from '@/services/jobApplication';
import { JobApplication, ApplicationFilters, ApplicationStatus, ContractType } from '@/types/jobApplication';
import { StatusConfig, ContractTypeLabels } from '@/constants';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function ApplicationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { canCreateApplication, isRecruiter } = usePermissions();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | undefined>();
  const [filterContractType, setFilterContractType] = useState<ContractType | undefined>();
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (params.success === 'true') {
      setShowSuccess(true);
      const timer = setTimeout(() => {
        setShowSuccess(false);
        router.setParams({ success: undefined });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [params.success]);

  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, [user])
  );

  useEffect(() => {
    applyFilters();
  }, [applications, searchQuery, filterStatus, filterContractType]);

  const loadApplications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getApplications(user.id);
      setApplications(data.sort((a, b) =>
        new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()
      ));
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les candidatures');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    if (!user) return;

    const filters: ApplicationFilters = {
      searchQuery: searchQuery || undefined,
      status: filterStatus,
      contractType: filterContractType,
    };

    const filtered = await filterApplications(user.id, filters);
    setFilteredApplications(filtered);
  };

  const handleDelete = async (id: string, event: any) => {
    event?.stopPropagation();
    if (!user) return;

    Alert.alert(
      'Supprimer',
      'Voulez-vous supprimer cette candidature ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApplication(id, user.id);
              loadApplications();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la candidature');
            }
          }
        }
      ]
    );
  };

  const renderApplication = ({ item }: { item: JobApplication }) => {
    const statusConfig = StatusConfig[item.status];

    return (
      <TouchableOpacity
        className="bg-white rounded-3xl mb-4 shadow-sm border border-gray-100 p-5 active:scale-[0.99]"
        style={{
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        }}
        onPress={() => router.push(`/application/${item.id}` as any)}
        activeOpacity={0.9}
      >
        <View className="flex-row justify-between items-start mb-4">
          {/* Header: Title & Company */}
          <View className="flex-1 mr-4">
            <Text className="text-xl font-bold text-gray-900 leading-tight mb-1">{item.title}</Text>
            <Text className="text-primary-600 font-semibold">{item.company}</Text>
          </View>

          {/* Status Badge */}
          <View
            className="px-3 py-1.5 rounded-full border"
            style={{
              backgroundColor: statusConfig.color + '15',
              borderColor: statusConfig.color + '30'
            }}
          >
            <Text
              className="text-xs font-bold capitalize"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Metadata Pills */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <Feather name="map-pin" size={12} color="#6B7280" />
            <Text className="ml-1.5 text-xs font-medium text-gray-600">{item.location}</Text>
          </View>
          <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <Feather name="briefcase" size={12} color="#6B7280" />
            <Text className="ml-1.5 text-xs font-medium text-gray-600">
              {ContractTypeLabels[item.contractType]}
            </Text>
          </View>
          <View className="flex-row items-center bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <Feather name="calendar" size={12} color="#6B7280" />
            <Text className="ml-1.5 text-xs font-medium text-gray-600">
              {new Date(item.applicationDate).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View className="flex-row justify-between items-center pt-4 border-t border-gray-100">
          <Text className="text-xs text-gray-400 font-medium">
            Candidaté il y a {Math.floor((new Date().getTime() - new Date(item.applicationDate).getTime()) / (1000 * 3600 * 24))} jours
          </Text>

          <TouchableOpacity
            onPress={(e) => handleDelete(item.id, e)}
            className="p-2 -mr-2 rounded-full active:bg-red-50"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="trash-2" size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{
        title: 'Candidatures',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F9FAFB' },
      }} />

      {showSuccess && (
        <View className="absolute top-4 left-4 right-4 z-50 bg-green-500 rounded-2xl px-5 py-4 flex-row items-center shadow-lg">
          <View className="h-8 w-8 rounded-full bg-white/20 items-center justify-center mr-3">
            <Feather name="check" size={20} color="#fff" />
          </View>
          <Text className="text-white font-bold text-base flex-1">Candidature envoyée !</Text>
        </View>
      )}

      {/* Recruiter Notice Box */}
      {isRecruiter && (
        <View className="mx-5 mt-4 mb-2 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex-row items-start z-10">
          <Feather name="info" size={20} color={Colors.primary} style={{ marginTop: 2, marginRight: 12 }} />
          <View className="flex-1">
            <Text className="text-blue-900 font-bold text-sm mb-1">Mode Candidat</Text>
            <Text className="text-blue-700 text-xs leading-5">
              Vous consultez vos propres candidatures.
            </Text>
            <TouchableOpacity
              className="mt-2 bg-white self-start px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm"
              onPress={() => router.push('/recruiter/applications')}
            >
              <Text className="text-primary-600 font-bold text-xs">Gérer mes offres</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search & Filter Header */}
      <View className="bg-gray-50 pb-2 z-10">
        <View className="px-5 py-2">
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
            <Feather name="search" size={20} color="#9CA3AF" className="mr-3" />
            <TextInput
              className="flex-1 text-base text-gray-900"
              placeholder="Rechercher..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Feather name="x-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}
        >
          <TouchableOpacity
            className={`px-4 py-2 rounded-full border ${!filterStatus
              ? 'bg-gray-900 border-gray-900'
              : 'bg-white border-gray-200'
              }`}
            onPress={() => setFilterStatus(undefined)}
          >
            <Text className={`text-sm font-semibold ${!filterStatus ? 'text-white' : 'text-gray-600'}`}>
              Tout
            </Text>
          </TouchableOpacity>
          {Object.values(ApplicationStatus).map(status => (
            <TouchableOpacity
              key={status}
              className={`px-4 py-2 rounded-full border ${filterStatus === status
                ? 'bg-gray-900 border-gray-900' // Using darker active state for "chip" look
                : 'bg-white border-gray-200'
                }`}
              onPress={() => setFilterStatus(filterStatus === status ? undefined : status)}
            >
              <Text className={`text-sm font-semibold ${filterStatus === status ? 'text-white' : 'text-gray-600'}`}>
                {StatusConfig[status].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredApplications}
        renderItem={renderApplication}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center pt-20 px-8">
            <View className="h-24 w-24 bg-gray-100 rounded-full items-center justify-center mb-6">
              <Feather name="inbox" size={40} color="#9CA3AF" />
            </View>
            <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
              {searchQuery || filterStatus ? 'Aucun résultat' : 'Aucune candidature'}
            </Text>
            <Text className="text-gray-500 text-center mb-8 leading-6">
              {searchQuery || filterStatus
                ? 'Essayez de modifier vos filtres ou votre recherche.'
                : 'Vous n\'avez pas encore postulé à une offre. Explorez les opportunités !'}
            </Text>
            {!searchQuery && !filterStatus && (
              <TouchableOpacity
                className="bg-primary-500 px-8 py-4 rounded-2xl shadow-lg shadow-primary-500/30 w-full"
                onPress={() => router.push('/(tabs)/jobs' as any)}
              >
                <Text className="text-white font-bold text-lg text-center">Explorer les offres</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}
