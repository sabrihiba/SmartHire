import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getJobById, updateJob } from '@/services/jobService';
import { Job, JobType } from '@/types/job';
import { Feather } from '@expo/vector-icons';

export default function EditJobScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { canCreateJob } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    type: JobType.FULL_TIME,
    description: '',
    salary: '',
    jobUrl: '',
    remote: false,
    requirements: [] as string[],
    currentRequirement: '',
  });

  useEffect(() => {
    if (id) {
      loadJob();
    }
  }, [id]);

  useEffect(() => {
    if (!canCreateJob || !user) {
      Alert.alert('Accès refusé', 'Seuls les recruteurs peuvent modifier des offres.');
      router.back();
      return;
    }
  }, [canCreateJob, user]);

  const loadJob = async () => {
    if (!id || !user) return;
    try {
      setLoading(true);
      const data = await getJobById(id);
      
      if (!data) {
        Alert.alert('Erreur', 'Offre non trouvée');
        router.back();
        return;
      }

      // Vérifier que l'utilisateur est le créateur de l'offre
      if (data.recruiterId !== user.id) {
        Alert.alert('Accès refusé', 'Vous ne pouvez modifier que vos propres offres.');
        router.back();
        return;
      }

      setJob(data);
      setFormData({
        title: data.title,
        company: data.company,
        location: data.location,
        type: data.type,
        description: data.description || '',
        salary: data.salary || '',
        jobUrl: data.jobUrl || '',
        remote: data.remote || false,
        requirements: data.requirements || [],
        currentRequirement: '',
      });
    } catch (error) {
      console.error('Error loading job:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'offre');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const addRequirement = () => {
    if (formData.currentRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, prev.currentRequirement.trim()],
        currentRequirement: '',
      }));
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!user || !id || !job) {
      Alert.alert('Erreur', 'Données manquantes');
      return;
    }

    if (!formData.title || !formData.company || !formData.location) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      await updateJob(id, {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        type: formData.type,
        description: formData.description,
        salary: formData.salary,
        jobUrl: formData.jobUrl,
        remote: formData.remote,
        requirements: formData.requirements.length > 0 ? formData.requirements : undefined,
      }, user.id);

      Alert.alert('Succès', 'Offre d\'emploi mise à jour avec succès', [
        { 
          text: 'OK', 
          onPress: () => {
            router.back();
          }
        },
      ]);
    } catch (error) {
      console.error('Error updating job:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'offre: ' + (error as any).message);
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

  if (!job) {
    return null;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Modifier l\'offre' }} />
      <ScrollView className="flex-1">
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
            <Text className="mb-2 text-sm font-semibold text-gray-700">Type d'emploi</Text>
            <View className="flex-row flex-wrap gap-2">
              {Object.values(JobType).map(type => (
                <TouchableOpacity
                  key={type}
                  className={`rounded-full px-4 py-2 border-2 ${
                    formData.type === type
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white border-gray-200'
                  }`}
                  onPress={() => setFormData({ ...formData, type })}
                >
                  <Text
                    className={`text-sm font-medium ${formData.type === type ? 'text-white' : 'text-gray-700'}`}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-700">Salaire</Text>
            <TextInput
              className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
              placeholder="Ex: 50k-70k €"
              placeholderTextColor="#9CA3AF"
              value={formData.salary}
              onChangeText={text => setFormData({ ...formData, salary: text })}
            />
          </View>

          <View className="mb-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-700">Télétravail possible</Text>
              <Switch
                value={formData.remote}
                onValueChange={value => setFormData({ ...formData, remote: value })}
                trackColor={{ false: '#E5E7EB', true: '#2563EB' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-700">Description</Text>
            <TextInput
              className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900 min-h-[100px]"
              placeholder="Description du poste..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={formData.description}
              onChangeText={text => setFormData({ ...formData, description: text })}
            />
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-700">Prérequis</Text>
            <View className="flex-row gap-2 mb-2">
              <TextInput
                className="flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base text-gray-900"
                placeholder="Ajouter un prérequis"
                placeholderTextColor="#9CA3AF"
                value={formData.currentRequirement}
                onChangeText={text => setFormData({ ...formData, currentRequirement: text })}
                onSubmitEditing={addRequirement}
              />
              <TouchableOpacity
                className="bg-primary-500 px-4 py-3 rounded-xl"
                onPress={addRequirement}
              >
                <Feather name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {formData.requirements.map((req, index) => (
                <View
                  key={index}
                  className="flex-row items-center bg-primary-100 px-3 py-2 rounded-full"
                >
                  <Text className="text-sm text-primary-700 mr-2">{req}</Text>
                  <TouchableOpacity onPress={() => removeRequirement(index)}>
                    <Feather name="x" size={16} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
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

          <TouchableOpacity
            style={{
              borderRadius: 16,
              backgroundColor: '#3B82F6',
              paddingVertical: 20,
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
              opacity: saving ? 0.6 : 1,
            }}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.9}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="save" size={20} color="#FFFFFF" />
                <Text style={{ marginLeft: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' }}>
                  Enregistrer les modifications
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

