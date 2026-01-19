import React, { useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { createJob } from '@/services/jobService';
import { JobType } from '@/types/job';
import { Feather } from '@expo/vector-icons';

export default function NewJobScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { canCreateJob } = usePermissions();
  const [loading, setLoading] = useState(false);

  // Si duplication, pré-remplir avec les données de l'offre
  const isDuplicate = params.duplicate === 'true';
  const initialRequirements = params.requirements
    ? (() => {
      try {
        return JSON.parse(params.requirements as string);
      } catch {
        return [];
      }
    })()
    : [];

  const [formData, setFormData] = useState({
    title: (params.title as string) || '',
    company: (params.company as string) || '',
    location: (params.location as string) || '',
    type: (params.type as JobType) || JobType.FULL_TIME,
    description: (params.description as string) || '',
    salary: (params.salary as string) || '',
    jobUrl: (params.jobUrl as string) || '',
    remote: params.remote === 'true' || false,
    requirements: initialRequirements,
    currentRequirement: '',
  });

  if (!canCreateJob) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-lg text-gray-600">Seuls les recruteurs peuvent créer des offres</Text>
      </View>
    );
  }

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
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    if (!formData.title || !formData.company || !formData.location) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setLoading(true);
      const newJob = await createJob({
        ...formData,
        postedDate: new Date().toISOString(),
        recruiterId: user.id,
        ...(formData.requirements.length > 0 ? { requirements: formData.requirements } : {}),
      });

      // Navigate first, then show alert (Alert callback doesn't work on web)
      // Add small delay to ensure AsyncStorage persists the data
      setTimeout(() => {
        router.push('/recruiter/jobs?refresh=' + Date.now());
        Alert.alert('Succès', 'Offre d\'emploi créée avec succès');
      }, 100);
    } catch (error) {
      console.error('Error creating job:', error);
      Alert.alert('Erreur', 'Impossible de créer l\'offre: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

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
          <Text className="mb-2 text-sm font-semibold text-gray-700">Type d'emploi</Text>
          <View className="flex-row flex-wrap gap-2">
            {Object.values(JobType).map(type => (
              <TouchableOpacity
                key={type}
                className={`rounded-full px-4 py-2 border-2 ${formData.type === type
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
            opacity: loading ? 0.6 : 1,
          }}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="upload" size={20} color="#FFFFFF" />
              <Text style={{ marginLeft: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' }}>
                Publier l'offre
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

