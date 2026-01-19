import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
  FlatList,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getApplicationsByRecruiter, updateApplication } from '@/services/jobApplication';
import { getJobsByRecruiter } from '@/services/jobService';
import { exportApplicationsToCSV } from '@/services/exportService';
import { createMessage, getMessagesByApplication } from '@/services/messageService';
import { JobApplication, ApplicationStatus } from '@/types/jobApplication';
import { Job } from '@/types/job';
import { Message } from '@/types/message';
import { StatusConfig } from '@/constants';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function RecruiterApplicationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { canManageApplications } = usePermissions();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [jobFilter, setJobFilter] = useState<string | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!canManageApplications || !user) {
      Alert.alert('Accès refusé', 'Seuls les recruteurs peuvent voir les candidatures reçues.');
      router.back();
      return;
    }
  }, [canManageApplications]);

  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, [user])
  );

  const loadApplications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [applicationsData, jobsData] = await Promise.all([
        getApplicationsByRecruiter(user.id),
        getJobsByRecruiter(user.id),
      ]);

      let data = applicationsData;

      // Filtrer par jobId si fourni dans les paramètres
      if (params.jobId) {
        data = data.filter(app => app.jobId === params.jobId);
        setJobFilter(params.jobId as string);
      }

      setApplications(data);
      setJobs(jobsData);
      applyFilters(data);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Erreur', 'Impossible de charger les candidatures');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (data: JobApplication[]) => {
    let filtered = data;

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filtre par offre
    if (jobFilter !== 'all') {
      filtered = filtered.filter(app => app.jobId === jobFilter);
    }

    // Filtre par date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let startDate: Date;

      switch (dateFilter) {
        case 'today':
          startDate = today;
          break;
        case 'week':
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(today);
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(app => {
        const appDate = new Date(app.applicationDate);
        return appDate >= startDate;
      });
    }

    setFilteredApplications(filtered);
  };

  useEffect(() => {
    applyFilters(applications);
  }, [statusFilter, jobFilter, dateFilter, applications]);

  const onRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: ApplicationStatus) => {
    try {
      setUpdatingStatus(true);
      const application = applications.find(app => app.id === applicationId);
      if (!application) return;

      // Business rules: Cannot change status if already ACCEPTED or REFUSED
      if (application.status === ApplicationStatus.ACCEPTED || application.status === ApplicationStatus.REFUSED) {
        Alert.alert('Erreur', 'Le statut ne peut pas être modifié une fois accepté ou refusé');
        return;
      }

      // Can only change to ACCEPTED or REFUSED if current status is INTERVIEW
      if (newStatus === ApplicationStatus.ACCEPTED || newStatus === ApplicationStatus.REFUSED) {
        if (application.status !== ApplicationStatus.INTERVIEW) {
          Alert.alert('Erreur', 'Vous ne pouvez changer le statut en "Acceptée" ou "Refusée" que depuis "Entretien"');
          return;
        }
      }

      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status: newStatus, updatedAt: new Date().toISOString() }
            : app
        )
      );

      // Mettre à jour dans la base de données avec l'historique
      // On utilise updateApplication qui gère maintenant les règles métier
      const { updateApplication } = await import('@/services/jobApplication');
      const updated = await updateApplication(applicationId, { status: newStatus }, user.id);

      if (!updated) {
        throw new Error("Update failed in database");
      }

      // Envoyer une notification au candidat
      const { sendStatusChangeNotification } = await import('@/services/notificationService');
      await sendStatusChangeNotification(
        application.title,
        application.company,
        StatusConfig[newStatus].label
      );

      Alert.alert('Succès', `Statut mis à jour: ${newStatus}`);
      setShowModal(false);
    } catch (error: any) {
      console.error('Error updating status:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour le statut');
      // Revert local state on error
      loadApplications();
    } finally {
      setUpdatingStatus(false);
    }
  };

  const viewCV = async (cvUrl: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(cvUrl, '_blank');
      } else {
        const canOpen = await Linking.canOpenURL(cvUrl);
        if (canOpen) {
          await Linking.openURL(cvUrl);
        } else {
          Alert.alert('Erreur', 'Impossible d\'ouvrir le fichier');
        }
      }
    } catch (error) {
      console.error('Error opening CV:', error);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le CV');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const renderApplicationItem = ({ item }: { item: JobApplication }) => {
    const statusConfig = StatusConfig[item.status];
    return (
      <TouchableOpacity
        className="bg-white rounded-3xl p-5 mb-3 border border-gray-100 shadow-medium active:scale-[0.98]"
        onPress={async () => {
          setSelectedApplication(item);
          setShowModal(true);
          // Charger les messages
          if (item.id) {
            const msgs = await getMessagesByApplication(item.id);
            setMessages(msgs);
          }
        }}
        activeOpacity={0.8}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-lg font-bold text-gray-900 mb-1">{item.title}</Text>
            <Text className="text-base text-gray-600 font-medium mb-1">{item.company}</Text>
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
          <Text className="text-sm text-gray-500 ml-1.5 font-medium">
            Candidature du {new Date(item.applicationDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Candidatures reçues' }} />

      {/* Filters */}
      <View className="bg-white border-b border-gray-200">
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-bold text-gray-900">Filtres</Text>
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={async () => {
                  try {
                    await exportApplicationsToCSV(filteredApplications, 'candidatures');
                  } catch (error) {
                    console.error('Export error:', error);
                  }
                }}
                className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-full"
              >
                <Feather name="download" size={14} color="#16A34A" />
                <Text className="text-sm text-green-600 font-semibold ml-1.5">Export CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex-row items-center"
              >
                <Text className="text-sm text-primary-500 mr-1">Avancés</Text>
                <Feather name={showAdvancedFilters ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Status Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-full ${statusFilter === 'all' ? 'bg-primary-500' : 'bg-gray-100'
                  }`}
              >
                <Text className={`text-sm font-semibold ${statusFilter === 'all' ? 'text-white' : 'text-gray-700'
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
                    className={`px-4 py-2 rounded-full ${statusFilter === status ? 'bg-primary-500' : 'bg-gray-100'
                      }`}
                  >
                    <Text className={`text-sm font-semibold ${statusFilter === status ? 'text-white' : 'text-gray-700'
                      }`}>
                      {StatusConfig[status].label} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <View className="mt-3 pt-3 border-t border-gray-200">
              {/* Job Filter */}
              <View className="mb-3">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Offre d'emploi</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => setJobFilter('all')}
                      className={`px-3 py-1.5 rounded-full ${jobFilter === 'all' ? 'bg-blue-500' : 'bg-gray-100'
                        }`}
                    >
                      <Text className={`text-xs font-semibold ${jobFilter === 'all' ? 'text-white' : 'text-gray-700'
                        }`}>
                        Toutes
                      </Text>
                    </TouchableOpacity>
                    {jobs.map(job => {
                      const count = applications.filter(app => app.jobId === job.id).length;
                      return (
                        <TouchableOpacity
                          key={job.id}
                          onPress={() => setJobFilter(job.id)}
                          className={`px-3 py-1.5 rounded-full ${jobFilter === job.id ? 'bg-blue-500' : 'bg-gray-100'
                            }`}
                        >
                          <Text className={`text-xs font-semibold ${jobFilter === job.id ? 'text-white' : 'text-gray-700'
                            }`} numberOfLines={1}>
                            {job.title} ({count})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Date Filter */}
              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Date de candidature</Text>
                <View className="flex-row gap-2">
                  {[
                    { key: 'all', label: 'Toutes' },
                    { key: 'today', label: 'Aujourd\'hui' },
                    { key: 'week', label: '7 jours' },
                    { key: 'month', label: '30 jours' },
                  ].map(filter => (
                    <TouchableOpacity
                      key={filter.key}
                      onPress={() => setDateFilter(filter.key as any)}
                      className={`px-3 py-1.5 rounded-full ${dateFilter === filter.key ? 'bg-green-500' : 'bg-gray-100'
                        }`}
                    >
                      <Text className={`text-xs font-semibold ${dateFilter === filter.key ? 'text-white' : 'text-gray-700'
                        }`}>
                        {filter.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
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
              {statusFilter === 'all'
                ? 'Aucune candidature reçue'
                : `Aucune candidature avec le statut "${StatusConfig[statusFilter as ApplicationStatus]?.label}"`}
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

              {selectedApplication.cvFileName && (
                <TouchableOpacity
                  className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4 mb-4 flex-row items-center"
                  onPress={() => selectedApplication.cvUrl && viewCV(selectedApplication.cvUrl)}
                >
                  <Feather name="file" size={24} color="#2563EB" />
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold text-primary-700">CV</Text>
                    <Text className="text-sm text-primary-600">{selectedApplication.cvFileName}</Text>
                  </View>
                  <Feather name="download" size={20} color="#2563EB" />
                </TouchableOpacity>
              )}

              {selectedApplication.notes && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Notes du candidat</Text>
                  <Text className="text-base text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {selectedApplication.notes}
                  </Text>
                </View>
              )}

              {/* Messages Section */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Messages</Text>
                <View className="bg-gray-50 rounded-xl p-3 mb-2 max-h-60 overflow-hidden">
                  <ScrollView nestedScrollEnabled>
                    {messages.length === 0 ? (
                      <Text className="text-gray-500 italic text-center py-4">Aucun message</Text>
                    ) : (
                      messages.map((msg, index) => (
                        <View key={index} className="mb-3">
                          <View className="flex-row justify-between mb-1">
                            <Text className={`text-xs font-bold ${msg.senderId === user?.id ? 'text-primary-600' : 'text-gray-700'}`}>
                              {msg.senderId === user?.id ? 'Moi' : 'Candidat'}
                            </Text>
                            <Text className="text-xs text-gray-400">
                              {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          </View>
                          <View className={`p-3 rounded-lg ${msg.senderId === user?.id ? 'bg-primary-100 ml-4' : 'bg-white border border-gray-200 mr-4'}`}>
                            <Text className="text-gray-800">{msg.message}</Text>
                          </View>
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>

                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                    placeholder="Écrire un message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                  />
                  <TouchableOpacity
                    className={`p-3 rounded-lg ${!newMessage.trim() || sendingMessage ? 'bg-gray-200' : 'bg-primary-500'}`}
                    disabled={!newMessage.trim() || sendingMessage}
                    onPress={async () => {
                      if (!newMessage.trim() || !selectedApplication || !user) return;
                      try {
                        setSendingMessage(true);
                        await createMessage({
                          applicationId: selectedApplication.id,
                          senderId: user.id, // Recruiter ID
                          senderRole: 'recruiter',
                          message: newMessage.trim(),
                        });
                        setNewMessage('');
                        // Reload messages
                        const msgs = await getMessagesByApplication(selectedApplication.id);
                        setMessages(msgs);
                      } catch (error) {
                        Alert.alert('Erreur', 'Impossible d\'envoyer le message');
                      } finally {
                        setSendingMessage(false);
                      }
                    }}
                  >
                    {sendingMessage ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Feather name="send" size={20} color={!newMessage.trim() ? '#9CA3AF' : '#fff'} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Changer le statut</Text>
                {(() => {
                  // Lock only if already ACCEPTED or REFUSED (final states)
                  const isFinalState = selectedApplication.status === ApplicationStatus.ACCEPTED ||
                    selectedApplication.status === ApplicationStatus.REFUSED;
                  
                  // Can only accept/refuse from INTERVIEW status
                  const canAcceptOrRefuse = selectedApplication.status === ApplicationStatus.INTERVIEW;
                  
                  // Can only set to INTERVIEW if not already INTERVIEW, ACCEPTED, or REFUSED
                  const canSetToInterview = selectedApplication.status !== ApplicationStatus.INTERVIEW &&
                    selectedApplication.status !== ApplicationStatus.ACCEPTED &&
                    selectedApplication.status !== ApplicationStatus.REFUSED;

                  return (
                    <View className="gap-2">
                      {isFinalState && (
                        <View className="bg-blue-50 p-3 rounded-lg mb-2 flex-row items-center border border-blue-100">
                          <Feather name="lock" size={16} color="#2563EB" />
                          <Text className="ml-2 text-xs text-blue-700 font-medium">
                            La décision a été prise et ne peut plus être modifiée.
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        className={`p-4 rounded-xl border-2 ${selectedApplication.status === ApplicationStatus.INTERVIEW
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-white border-gray-200'
                          } ${!canSetToInterview ? 'opacity-50' : ''}`}
                        onPress={() => canSetToInterview && updateApplicationStatus(selectedApplication.id, ApplicationStatus.INTERVIEW)}
                        disabled={updatingStatus || !canSetToInterview}
                      >
                        <View className="flex-row items-center">
                          <Feather
                            name="calendar"
                            size={20}
                            color={selectedApplication.status === ApplicationStatus.INTERVIEW ? '#2563EB' : '#6B7280'}
                          />
                          <Text
                            className={`ml-3 text-base font-semibold ${selectedApplication.status === ApplicationStatus.INTERVIEW
                              ? 'text-blue-700'
                              : 'text-gray-700'
                              }`}
                          >
                            Convoquer en entretien
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className={`p-4 rounded-xl border-2 ${selectedApplication.status === ApplicationStatus.ACCEPTED
                          ? 'bg-green-50 border-green-500'
                          : 'bg-white border-gray-200'
                          } ${!canAcceptOrRefuse ? 'opacity-50' : ''}`}
                        onPress={() => canAcceptOrRefuse && updateApplicationStatus(selectedApplication.id, ApplicationStatus.ACCEPTED)}
                        disabled={updatingStatus || !canAcceptOrRefuse}
                      >
                        <View className="flex-row items-center">
                          <Feather
                            name="check-circle"
                            size={20}
                            color={selectedApplication.status === ApplicationStatus.ACCEPTED ? '#16A34A' : '#6B7280'}
                          />
                          <Text
                            className={`ml-3 text-base font-semibold ${selectedApplication.status === ApplicationStatus.ACCEPTED
                              ? 'text-green-700'
                              : 'text-gray-700'
                              }`}
                          >
                            Accepter
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className={`p-4 rounded-xl border-2 ${selectedApplication.status === ApplicationStatus.REFUSED
                          ? 'bg-red-50 border-red-500'
                          : 'bg-white border-gray-200'
                          } ${!canAcceptOrRefuse ? 'opacity-50' : ''}`}
                        onPress={() => canAcceptOrRefuse && updateApplicationStatus(selectedApplication.id, ApplicationStatus.REFUSED)}
                        disabled={updatingStatus || !canAcceptOrRefuse}
                      >
                        <View className="flex-row items-center">
                          <Feather
                            name="x-circle"
                            size={20}
                            color={selectedApplication.status === ApplicationStatus.REFUSED ? '#EF4444' : '#6B7280'}
                          />
                          <Text
                            className={`ml-3 text-base font-semibold ${selectedApplication.status === ApplicationStatus.REFUSED
                              ? 'text-red-700'
                              : 'text-gray-700'
                              }`}
                          >
                            Refuser
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

