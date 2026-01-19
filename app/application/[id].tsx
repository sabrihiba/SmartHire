import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getApplicationById, deleteApplication, createApplication, updateApplication } from '@/services/jobApplication';
import { getApplicationHistory } from '@/services/applicationHistory';
import { getMessagesByApplication } from '@/services/messageService';
import { scheduleReminderNotification } from '@/services/notificationService';
import { JobApplication, ApplicationStatus, ApplicationHistory } from '@/types/jobApplication';
import { Message } from '@/types/message';
import { StatusConfig, ContractTypeLabels } from '@/constants';
import { Feather } from '@expo/vector-icons';

export default function ApplicationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [history, setHistory] = useState<ApplicationHistory[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadApplication();
    }, [id, user])
  );

  const loadApplication = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);
      const [data, historyData, messagesData] = await Promise.all([
        getApplicationById(id, user.id),
        getApplicationHistory(id),
        getMessagesByApplication(id),
      ]);
      if (!data) {
        Alert.alert('Erreur', 'Candidature non trouvée');
        router.back();
        return;
      }
      setApplication(data);
      setHistory(historyData);
      setMessages(messagesData);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la candidature');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!user || !application) return;

    if (Platform.OS === 'web') {
      if (window.confirm('Êtes-vous sûr de vouloir supprimer cette candidature ?')) {
        deleteApplication(application.id, user.id)
          .then(() => router.back())
          .catch(() => window.alert('Impossible de supprimer la candidature'));
      }
      return;
    }

    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cette candidature ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApplication(application.id, user.id);
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la candidature');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!application) {
    return null;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplication();
    setRefreshing(false);
  };

  const statusConfig = StatusConfig[application.status] || { label: application.status, color: '#000' };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
      }
    >
      <View className="bg-white px-4 py-6 border-b border-gray-200">
        <View className="mb-3 flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="mb-2 text-2xl font-bold text-gray-900">{application.title}</Text>
            <Text className="text-lg text-gray-600">{application.company}</Text>
          </View>
          <View
            className="rounded-full px-4 py-2"
            style={{ backgroundColor: statusConfig.color + '20' }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-white px-4 py-5 mb-2 border-b border-gray-200">
        <Text className="mb-4 text-lg font-bold text-gray-900">Informations</Text>
        <View className="mb-3 flex-row">
          <Text className="w-32 text-base text-gray-600">Lieu :</Text>
          <Text className="flex-1 text-base text-gray-900">{application.location}</Text>
        </View>
        <View className="mb-3 flex-row">
          <Text className="w-32 text-base text-gray-600">Type de contrat :</Text>
          <Text className="flex-1 text-base text-gray-900">
            {ContractTypeLabels[application.contractType]}
          </Text>
        </View>
        <View className="mb-3 flex-row">
          <Text className="w-32 text-base text-gray-600">Date de candidature :</Text>
          <Text className="flex-1 text-base text-gray-900">
            {new Date(application.applicationDate).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        {application.jobUrl && (
          <View className="mb-3 flex-row">
            <Text className="w-32 text-base text-gray-600">Lien de l'annonce :</Text>
            <Text className="flex-1 text-base text-primary-500" numberOfLines={1}>
              {application.jobUrl}
            </Text>
          </View>
        )}
      </View>

      {application.notes && (
        <View className="bg-white px-4 py-5 mb-2 border-b border-gray-200">
          <Text className="mb-3 text-lg font-bold text-gray-900">Notes</Text>
          <Text className="text-base leading-6 text-gray-900">{application.notes}</Text>
        </View>
      )}

      {application.lastFollowUp && (
        <View className="bg-white px-4 py-5 mb-2 border-b border-gray-200">
          <Text className="mb-2 text-lg font-bold text-gray-900">Relances</Text>
          <Text className="text-sm text-gray-600 mb-1">
            Dernière relance : {new Date(application.lastFollowUp).toLocaleDateString('fr-FR')}
          </Text>
          <Text className="text-sm text-gray-600">
            Nombre de relances : {application.followUpCount || 0}
          </Text>
        </View>
      )}

      {messages.length > 0 && (
        <View className="bg-white px-4 py-5 mb-2 border-b border-gray-200">
          <Text className="mb-3 text-lg font-bold text-gray-900">Messages du recruteur</Text>
          {messages.map((msg, index) => (
            <View key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
              <View className="flex-row justify-between mb-1">
                <Text className="font-semibold text-gray-800">Recruteur</Text>
                <Text className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              <Text className="text-gray-700">{msg.message}</Text>
            </View>
          ))}
        </View>
      )}

      {application.documents && application.documents.length > 0 && (
        <View className="bg-white px-4 py-5 mb-2 border-b border-gray-200">
          <Text className="mb-3 text-lg font-bold text-gray-900">Documents joints</Text>
          {application.documents.map((doc, index) => (
            <View key={index} className="mb-2 flex-row items-center">
              <Feather name="file" size={18} color="#2563EB" />
              <Text className="ml-2 text-base text-primary-500">{doc}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Decision Final Notice */}
      {(application.status === ApplicationStatus.ACCEPTED ||
        application.status === ApplicationStatus.REFUSED ||
        application.status === ApplicationStatus.INTERVIEW) && (
          <View className="mx-4 mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100 flex-row items-start">
            <Feather name="lock" size={18} color="#2563EB" style={{ marginTop: 2, marginRight: 12 }} />
            <View className="flex-1">
              <Text className="text-blue-900 font-bold text-sm mb-1">Candidature verrouillée</Text>
              <Text className="text-blue-700 text-xs leading-5">
                Une décision a été prise pour cette candidature. Les modifications et la suppression sont désormais désactivées.
              </Text>
            </View>
          </View>
        )}

      <View className="px-4 py-6 gap-3">
        {(() => {
          const isLocked = application.status === ApplicationStatus.ACCEPTED ||
            application.status === ApplicationStatus.REFUSED ||
            application.status === ApplicationStatus.INTERVIEW;

          return (
            <>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className={`flex-1 rounded-xl py-4 shadow-lg ${isLocked ? 'bg-gray-300' : 'bg-primary-500 shadow-primary-500/30'}`}
                  onPress={() => !isLocked && router.push(`/application/${application.id}/edit` as any)}
                  disabled={isLocked}
                >
                  <Text className="text-center text-base font-semibold text-white">Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 rounded-xl py-4 shadow-lg ${isLocked ? 'bg-gray-300' : 'bg-green-500'}`}
                  onPress={async () => {
                    if (isLocked || !user || !application) return;
                    try {
                      await createApplication({
                        title: application.title,
                        company: application.company,
                        location: application.location,
                        jobUrl: application.jobUrl,
                        contractType: application.contractType,
                        applicationDate: new Date().toISOString().split('T')[0],
                        status: ApplicationStatus.TO_APPLY,
                        notes: '',
                        cvUrl: application.cvUrl,
                        cvFileName: application.cvFileName,
                        jobId: application.jobId,
                        recruiterId: application.recruiterId,
                        userId: user.id,
                      });
                      Alert.alert('Succès', 'Candidature dupliquée avec succès');
                      router.push('/(tabs)/applications');
                    } catch (error) {
                      Alert.alert('Erreur', 'Impossible de dupliquer la candidature');
                    }
                  }}
                  disabled={isLocked}
                >
                  <Text className="text-center text-base font-semibold text-white">Dupliquer</Text>
                </TouchableOpacity>
              </View>

              {/* Relance button - only for sent/interview status and IF NOT ACCEPTED/REFUSED */}
              {(application.status === ApplicationStatus.SENT || application.status === ApplicationStatus.INTERVIEW) && (
                <TouchableOpacity
                  className="w-full rounded-xl bg-orange-500 py-4 shadow-lg flex-row items-center justify-center"
                  onPress={async () => {
                    if (!user || !application) return;
                    try {
                      const followUpCount = (application.followUpCount || 0) + 1;
                      await updateApplication(application.id, {
                        lastFollowUp: new Date().toISOString(),
                        followUpCount: followUpCount,
                      }, user.id);

                      // Planifier une notification de rappel dans 7 jours
                      const settings = await import('@/services/notificationService').then(m => m.getNotificationSettings());
                      if (settings.enabled && settings.reminders) {
                        await scheduleReminderNotification(
                          application.id,
                          application.title,
                          application.company,
                          settings.reminderDays || 7
                        );
                      }

                      Alert.alert('Succès', `Relance enregistrée (${followUpCount} relance${followUpCount > 1 ? 's' : ''})`);
                      // Recharger les données
                      const updated = await getApplicationById(application.id, user.id);
                      if (updated) {
                        setApplication(updated);
                      }
                    } catch (error) {
                      Alert.alert('Erreur', 'Impossible d\'enregistrer la relance');
                    }
                  }}
                >
                  <Feather name="send" size={18} color="#FFFFFF" />
                  <Text className="ml-2 text-center text-base font-semibold text-white">
                    Relancer le recruteur
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className={`w-full rounded-xl py-4 shadow-lg ${isLocked ? 'bg-gray-200' : 'bg-red-500'}`}
                onPress={() => !isLocked && handleDelete()}
                disabled={isLocked}
              >
                <Text className={`text-center text-base font-semibold ${isLocked ? 'text-gray-400' : 'text-white'}`}>Supprimer</Text>
              </TouchableOpacity>
            </>
          );
        })()}
      </View>
    </ScrollView>
  );
}
