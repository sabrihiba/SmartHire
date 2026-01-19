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
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { createApplication, hasUserAppliedToJob } from '@/services/jobApplication';
import { ApplicationStatus, ContractType } from '@/types/jobApplication';
import { fetchJobs } from '@/services/job';
import { getJobById, getAllJobs } from '@/services/jobService';
import { Job } from '@/types/job';
import { Feather } from '@expo/vector-icons';

export default function NewApplicationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { canCreateApplication } = usePermissions();

  useEffect(() => {
    if (!canCreateApplication) {
      Alert.alert('Accès refusé', 'Seuls les postulants peuvent créer des candidatures.');
      router.back();
    }
  }, [canCreateApplication]);
  const [loading, setLoading] = useState(false);
  
  // Extract param values to avoid infinite loop
  const paramJobId = params.jobId as string | undefined;
  const paramTitle = params.title as string | undefined;
  const paramCompany = params.company as string | undefined;
  const paramLocation = params.location as string | undefined;
  const paramJobUrl = params.jobUrl as string | undefined;
  
  const [formData, setFormData] = useState({
    title: paramTitle || '',
    company: paramCompany || '',
    location: paramLocation || '',
    jobUrl: paramJobUrl || '',
    contractType: ContractType.CDI,
    applicationDate: new Date().toISOString().split('T')[0],
    status: ApplicationStatus.TO_APPLY,
    notes: '',
    cvUrl: '',
    cvFileName: '',
    jobId: paramJobId || '',
  });
  const [cvFile, setCvFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);
  const [showJobSelector, setShowJobSelector] = useState(false);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    // Mettre à jour le formulaire si les paramètres changent
    if (paramJobId || paramTitle || paramCompany || paramLocation || paramJobUrl) {
      setFormData(prev => ({
        ...prev,
        jobId: paramJobId || prev.jobId,
        title: paramTitle || prev.title,
        company: paramCompany || prev.company,
        location: paramLocation || prev.location,
        jobUrl: paramJobUrl || prev.jobUrl,
      }));
    }
  }, [paramJobId, paramTitle, paramCompany, paramLocation, paramJobUrl]);

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      // Récupérer les offres mockées et les offres créées par les recruteurs
      const [mockJobs, recruiterJobs] = await Promise.all([
        fetchJobs({ limit: 100 }).catch(() => []),
        getAllJobs().catch(() => []),
      ]);
      // Combiner et dédupliquer par ID
      const allJobs = [...mockJobs, ...recruiterJobs];
      const uniqueJobs = allJobs.filter((job, index, self) =>
        index === self.findIndex(j => j.id === job.id)
      );
      setAvailableJobs(uniqueJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoadingJobs(false);
    }
  };

  const selectJob = (job: Job) => {
    setFormData(prev => ({
      ...prev,
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      jobUrl: job.jobUrl,
      contractType: ContractType.CDI, // Default, can be changed
    }));
    setShowJobSelector(false);
  };

  const pickCV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setCvFile(result);
        setFormData(prev => ({
          ...prev,
          cvUrl: file.uri,
          cvFileName: file.name || 'CV',
        }));
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
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
      
      // Vérifier si l'utilisateur a déjà postulé à cette offre
      if (formData.jobId) {
        const alreadyApplied = await hasUserAppliedToJob(user.id, formData.jobId);
        if (alreadyApplied) {
          Alert.alert('Déjà postulé', 'Vous avez déjà postulé à cette offre d\'emploi.');
          setLoading(false);
          return;
        }
      }
      
      // Si une offre est sélectionnée, récupérer le recruiterId
      let recruiterId: string | undefined;
      if (formData.jobId) {
        const job = await getJobById(formData.jobId);
        if (job && job.recruiterId) {
          recruiterId = job.recruiterId;
        }
      }

      await createApplication({
        ...formData,
        userId: user.id,
        cvUrl: formData.cvUrl || undefined,
        cvFileName: formData.cvFileName || undefined,
        jobId: formData.jobId || undefined,
        recruiterId: recruiterId,
      });

      // Navigation fluide sans alerte bloquante sur Web
      // On passe un paramètre pour afficher un toast sur l'écran suivant si besoin
      router.replace({
        pathname: '/(tabs)/applications',
        params: { success: 'true' }
      });
    } catch (error) {
      console.error('Error creating application:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter la candidature: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Choisir une offre existante</Text>
          <TouchableOpacity
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 flex-row items-center justify-between"
            onPress={() => {
              loadJobs();
              setShowJobSelector(true);
            }}
          >
            <Text className="text-base text-gray-700">
              {formData.jobId ? 'Offre sélectionnée' : 'Sélectionner une offre'}
            </Text>
            <Feather name="chevron-right" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Titre du poste *</Text>
          <TextInput
            className={`rounded-xl border-2 bg-white px-4 py-4 text-base ${formData.jobId ? 'bg-gray-50 text-gray-600' : 'text-gray-900'}`}
            placeholder="Ex: Développeur React Native"
            placeholderTextColor="#9CA3AF"
            value={formData.title}
            onChangeText={text => setFormData({ ...formData, title: text })}
            editable={!formData.jobId}
          />
          {formData.jobId && (
            <Text className="mt-1 text-xs text-gray-500">Ce champ est verrouillé car une offre a été sélectionnée</Text>
          )}
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Entreprise *</Text>
          <TextInput
            className={`rounded-xl border-2 bg-white px-4 py-4 text-base ${formData.jobId ? 'bg-gray-50 text-gray-600' : 'text-gray-900'}`}
            placeholder="Ex: Tech Corp"
            placeholderTextColor="#9CA3AF"
            value={formData.company}
            onChangeText={text => setFormData({ ...formData, company: text })}
            editable={!formData.jobId}
          />
          {formData.jobId && (
            <Text className="mt-1 text-xs text-gray-500">Ce champ est verrouillé car une offre a été sélectionnée</Text>
          )}
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Lieu *</Text>
          <TextInput
            className={`rounded-xl border-2 bg-white px-4 py-4 text-base ${formData.jobId ? 'bg-gray-50 text-gray-600' : 'text-gray-900'}`}
            placeholder="Ex: Paris, Remote"
            placeholderTextColor="#9CA3AF"
            value={formData.location}
            onChangeText={text => setFormData({ ...formData, location: text })}
            editable={!formData.jobId}
          />
          {formData.jobId && (
            <Text className="mt-1 text-xs text-gray-500">Ce champ est verrouillé car une offre a été sélectionnée</Text>
          )}
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Lien de l'annonce</Text>
          <TextInput
            className={`rounded-xl border-2 bg-white px-4 py-4 text-base ${formData.jobId ? 'bg-gray-50 text-gray-600' : 'text-gray-900'}`}
            placeholder="https://..."
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
            value={formData.jobUrl}
            onChangeText={text => setFormData({ ...formData, jobUrl: text })}
            editable={!formData.jobId}
          />
          {formData.jobId && (
            <Text className="mt-1 text-xs text-gray-500">Ce champ est verrouillé car une offre a été sélectionnée</Text>
          )}
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

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">CV (PDF ou Image)</Text>
          <TouchableOpacity
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 flex-row items-center justify-between"
            onPress={pickCV}
          >
            <View className="flex-1">
              {formData.cvFileName ? (
                <View className="flex-row items-center">
                  <Feather name="file" size={20} color="#2563EB" />
                  <Text className="ml-2 text-base text-gray-900" numberOfLines={1}>
                    {formData.cvFileName}
                  </Text>
                </View>
              ) : (
                <Text className="text-base text-gray-500">Sélectionner un fichier PDF ou image</Text>
              )}
            </View>
            <Feather name="upload" size={20} color="#6B7280" />
          </TouchableOpacity>
          {formData.cvFileName && (
            <TouchableOpacity
              className="mt-2 flex-row items-center"
              onPress={() => {
                setCvFile(null);
                setFormData(prev => ({ ...prev, cvUrl: '', cvFileName: '' }));
              }}
            >
              <Feather name="x-circle" size={16} color="#EF4444" />
              <Text className="ml-1 text-sm text-red-500">Supprimer le fichier</Text>
            </TouchableOpacity>
          )}
          <Text className="mt-1 text-xs text-gray-500">
            Formats acceptés: PDF, JPG, PNG
          </Text>
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
              <Feather name="check-circle" size={20} color="#FFFFFF" />
              <Text style={{ marginLeft: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' }}>
                Ajouter la candidature
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Job Selector Modal */}
      <Modal
        visible={showJobSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJobSelector(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">Sélectionner une offre</Text>
            <TouchableOpacity onPress={() => setShowJobSelector(false)}>
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1">
            {loadingJobs ? (
              <View className="flex-1 items-center justify-center py-20">
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : (
              <View className="p-4">
                {availableJobs.map(job => (
                  <TouchableOpacity
                    key={job.id}
                    className="mb-3 rounded-xl border-2 border-gray-200 bg-white p-4"
                    onPress={() => selectJob(job)}
                  >
                    <Text className="text-lg font-bold text-gray-900 mb-1">{job.title}</Text>
                    <Text className="text-base text-gray-600 mb-2">{job.company}</Text>
                    <View className="flex-row items-center gap-4">
                      <View className="flex-row items-center">
                        <Feather name="map-pin" size={14} color="#6B7280" />
                        <Text className="ml-1 text-sm text-gray-600">{job.location}</Text>
                      </View>
                      <Text className="text-sm text-gray-600">{job.type}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {availableJobs.length === 0 && (
                  <View className="py-20 items-center">
                    <Feather name="briefcase" size={48} color="#9CA3AF" />
                    <Text className="mt-4 text-gray-600">Aucune offre disponible</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
