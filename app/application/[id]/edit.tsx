import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getApplicationById, updateApplication } from '@/services/jobApplication';
import { JobApplication, ApplicationStatus, ContractType } from '@/types/jobApplication';
import { usePermissions } from '@/hooks/usePermissions';

export default function EditApplicationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { isRecruiter } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<JobApplication>>({});
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    loadApplication();
  }, [id, user]);

  const loadApplication = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);
      const data = await getApplicationById(id, user.id);
      if (!data) {
        Alert.alert('Erreur', 'Candidature non trouvée');
        router.back();
        return;
      }
      // Check if application can be edited
      // Candidates cannot edit after sending (status != TO_APPLY)
      // Recruiters cannot edit applications
      if (!isRecruiter && data.status !== ApplicationStatus.TO_APPLY) {
        setCanEdit(false);
        Alert.alert(
          'Modification impossible',
          'Vous ne pouvez pas modifier une candidature déjà envoyée.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
        return;
      }
      
      if (isRecruiter) {
        Alert.alert('Accès refusé', 'Les recruteurs ne peuvent pas modifier les candidatures.');
        router.back();
        return;
      }

      setFormData({
        title: data.title,
        company: data.company,
        location: data.location,
        jobUrl: data.jobUrl || '',
        contractType: data.contractType,
        applicationDate: data.applicationDate.split('T')[0],
        status: data.status,
        notes: data.notes || '',
      });
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger la candidature');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !id) return;

    if (!formData.title || !formData.company || !formData.location) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      await updateApplication(id, formData, user.id);

      // Retour immédiat sans alerte ("fluide")
      router.back();

    } catch (error) {
      console.error('Erreur update:', error);
      if (Platform.OS === 'web') {
        window.alert('Impossible de modifier la candidature');
      } else {
        Alert.alert('Erreur', 'Impossible de modifier la candidature');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Titre du poste *</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
            placeholder="Ex: Développeur React Native"
            placeholderTextColor="#9CA3AF"
            value={formData.title}
            onChangeText={text => setFormData({ ...formData, title: text })}
          />
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Entreprise *</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
            placeholder="Ex: Tech Corp"
            placeholderTextColor="#9CA3AF"
            value={formData.company}
            onChangeText={text => setFormData({ ...formData, company: text })}
          />
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Lieu *</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
            placeholder="Ex: Paris, Remote"
            placeholderTextColor="#9CA3AF"
            value={formData.location}
            onChangeText={text => setFormData({ ...formData, location: text })}
          />
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Lien de l'annonce</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
            placeholder="https://..."
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
            value={formData.jobUrl}
            onChangeText={text => setFormData({ ...formData, jobUrl: text })}
          />
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Type de contrat</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.values(ContractType).map(type => (
              <TouchableOpacity
                key={type}
                className={`rounded-full px-4 py-2 border-2 ${formData.contractType === type
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-gray-200'
                  }`}
                onPress={() => setFormData({ ...formData, contractType: type })}
              >
                <Text
                  className={`text-sm font-medium ${formData.contractType === type ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Date de candidature</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
            value={formData.applicationDate}
            onChangeText={text => setFormData({ ...formData, applicationDate: text })}
          />
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Statut</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.values(ApplicationStatus).map(status => (
              <TouchableOpacity
                key={status}
                className={`rounded-full px-4 py-2 border-2 ${formData.status === status
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-gray-200'
                  }`}
                onPress={() => setFormData({ ...formData, status })}
              >
                <Text
                  className={`text-sm font-medium ${formData.status === status ? 'text-white' : 'text-gray-700'
                    }`}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mb-6">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Notes</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900 min-h-[100px]"
            placeholder="Notes supplémentaires..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={formData.notes}
            onChangeText={text => setFormData({ ...formData, notes: text })}
          />
        </View>

        <TouchableOpacity
          className={`rounded-xl bg-primary-500 py-4 shadow-lg shadow-primary-500/30 ${saving ? 'opacity-60' : ''}`}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">
              Enregistrer les modifications
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
