import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getAllApplicationsAdmin } from '@/services/database';
import { updateApplication } from '@/services/jobApplication';
import { JobApplication, ApplicationStatus } from '@/types/jobApplication';
import { StatusConfig } from '@/constants';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function AdminApplicationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, canViewAllApplications, canModifyAnyApplication } = usePermissions();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isAdmin || !canViewAllApplications) {
      Alert.alert('Accès refusé', 'Seuls les administrateurs peuvent voir toutes les candidatures.');
      router.back();
    }
  }, [isAdmin, canViewAllApplications]);

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllApplicationsAdmin();
      setApplications(data);
      applyFilters(data);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Erreur', 'Impossible de charger les candidatures');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, [loadApplications])
  );

  const applyFilters = (data: JobApplication[]) => {
    if (statusFilter === 'all') {
      setFilteredApplications(data);
    } else {
      setFilteredApplications(data.filter(app => app.status === statusFilter));
    }
  };

  useEffect(() => {
    applyFilters(applications);
  }, [statusFilter, applications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      setUpdatingStatus(true);
      const application = applications.find(app => app.id === applicationId);
      if (!application) return;

      await updateApplication(applicationId, { status: newStatus }, application.userId);

      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status: newStatus, updatedAt: new Date().toISOString() }
            : app
        )
      );

      Alert.alert('Succès', `Statut mis à jour: ${StatusConfig[newStatus].label}`);
      setShowModal(false);
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderApplicationItem = ({ item }: { item: JobApplication }) => {
    const statusConfig = StatusConfig[item.status];
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-medium active:scale-[0.98]"
        onPress={() => {
          setSelectedApplication(item);
          setShowModal(true);
        }}
        activeOpacity={0.8}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-bold text-gray-900 mb-1">{item.title}</Text>
            <Text className="text-base text-gray-600 mb-1">{item.company}</Text>
            <View className="flex-row items-center mt-2">
              <Feather name="map-pin" size={14} color="#9CA3AF" />
              <Text className="text-sm text-gray-500 ml-1.5">{item.location}</Text>
            </View>
          </View>
          <View
            className="px-4 py-2 rounded-full shadow-soft"
            style={{ backgroundColor: statusConfig.color + '15' }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center pt-3 border-t border-gray-100">
          <Feather name="calendar" size={14} color="#9CA3AF" />
          <Text className="text-sm text-gray-500 ml-1.5">
            Candidature du {new Date(item.applicationDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Gestion des candidatures' }} />
      
      {/* Status Filter */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-full ${
              statusFilter === 'all' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
          >
            <Text className={`text-sm font-semibold ${
              statusFilter === 'all' ? 'text-white' : 'text-gray-700'
            }`}>
              Toutes ({applications.length})
            </Text>
          </TouchableOpacity>
          {Object.values(ApplicationStatus).map(status => {
            const count = applications.filter(app => app.status === status).length;
            return (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-full ${
                  statusFilter === status ? 'bg-primary-500' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm font-semibold ${
                  statusFilter === status ? 'text-white' : 'text-gray-700'
                }`}>
                  {StatusConfig[status].label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredApplications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplicationItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Feather name="inbox" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-base text-gray-500">
              Aucune candidature trouvée
            </Text>
          </View>
        }
      />

      {/* Modal de détails */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">Détails de la candidature</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedApplication && (
            <ScrollView className="flex-1 p-4">
              <View className="mb-4">
                <Text className="text-2xl font-bold text-gray-900">{selectedApplication.title}</Text>
                <Text className="text-lg text-gray-600 mt-1">{selectedApplication.company}</Text>
                <Text className="text-base text-gray-500 mt-1">{selectedApplication.location}</Text>
              </View>

              {selectedApplication.notes && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Notes</Text>
                  <Text className="text-base text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedApplication.notes}
                  </Text>
                </View>
              )}

              {canModifyAnyApplication && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-3">Changer le statut</Text>
                  <View className="gap-2">
                    {Object.values(ApplicationStatus).map(status => (
                      <TouchableOpacity
                        key={status}
                        className={`p-4 rounded-xl border-2 ${
                          selectedApplication.status === status
                            ? 'bg-primary-50 border-primary-500'
                            : 'bg-white border-gray-200'
                        }`}
                        onPress={() => updateApplicationStatus(selectedApplication.id, status)}
                        disabled={updatingStatus}
                      >
                        <Text className={`text-base font-semibold ${
                          selectedApplication.status === status
                            ? 'text-primary-700'
                            : 'text-gray-700'
                        }`}>
                          {StatusConfig[status].label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

