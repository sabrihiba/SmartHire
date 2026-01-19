import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { updateUser } from '@/services/userService';
import { UserRole } from '@/types';
import { Feather } from '@expo/vector-icons';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { isCandidate, isRecruiter } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    // Champs postulant
    skills: user?.skills?.join(', ') || '',
    experience: user?.experience || '',
    education: user?.education || '',
    linkedinUrl: user?.linkedinUrl || '',
    // Champs recruteur
    companyName: user?.companyName || '',
    companySector: user?.companySector || '',
    companyWebsite: user?.companyWebsite || '',
    companySize: user?.companySize || '',
  });

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Utilisateur non trouvé');
      return;
    }

    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert('Erreur', 'Le nom et l\'email sont obligatoires');
      return;
    }

    try {
      setLoading(true);
      const updates: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
      };

      if (isCandidate) {
        updates.skills = formData.skills.trim() 
          ? formData.skills.split(',').map(s => s.trim()).filter(Boolean)
          : undefined;
        updates.experience = formData.experience.trim() || undefined;
        updates.education = formData.education.trim() || undefined;
        updates.linkedinUrl = formData.linkedinUrl.trim() || undefined;
      }

      if (isRecruiter) {
        updates.companyName = formData.companyName.trim() || undefined;
        updates.companySector = formData.companySector.trim() || undefined;
        updates.companyWebsite = formData.companyWebsite.trim() || undefined;
        updates.companySize = formData.companySize.trim() || undefined;
      }

      const updatedUser = await updateUser(user.id, updates);
      if (updatedUser) {
        await refreshUser();
        Alert.alert('Succès', 'Profil mis à jour avec succès', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/profile') },
        ]);
      } else {
        throw new Error('La mise à jour a échoué');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Modifier le profil' }} />
      <View className="p-4">
        {/* Champs communs */}
        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Nom complet *</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
            placeholder="Votre nom"
            value={formData.name}
            onChangeText={text => setFormData({ ...formData, name: text })}
          />
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Email *</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
            placeholder="votre@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={text => setFormData({ ...formData, email: text })}
          />
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Téléphone</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
            placeholder="+33 6 12 34 56 78"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={text => setFormData({ ...formData, phone: text })}
          />
        </View>

        <View className="mb-5">
          <Text className="mb-2 text-sm font-semibold text-gray-700">Adresse</Text>
          <TextInput
            className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
            placeholder="Ville, Pays"
            value={formData.address}
            onChangeText={text => setFormData({ ...formData, address: text })}
          />
        </View>

        {/* Champs spécifiques aux postulants */}
        {isCandidate && (
          <>
            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Compétences</Text>
              <TextInput
                className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
                placeholder="React, TypeScript, Node.js (séparées par des virgules)"
                value={formData.skills}
                onChangeText={text => setFormData({ ...formData, skills: text })}
              />
              <Text className="mt-1 text-xs text-gray-500">Séparez les compétences par des virgules</Text>
            </View>

            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Expérience</Text>
              <TextInput
                className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
                placeholder="Ex: 3 ans en développement web"
                value={formData.experience}
                onChangeText={text => setFormData({ ...formData, experience: text })}
              />
            </View>

            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Formation</Text>
              <TextInput
                className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
                placeholder="Ex: Master en Informatique"
                value={formData.education}
                onChangeText={text => setFormData({ ...formData, education: text })}
              />
            </View>

            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Profil LinkedIn</Text>
              <TextInput
                className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
                placeholder="https://linkedin.com/in/votre-profil"
                keyboardType="url"
                autoCapitalize="none"
                value={formData.linkedinUrl}
                onChangeText={text => setFormData({ ...formData, linkedinUrl: text })}
              />
            </View>
          </>
        )}

        {/* Champs spécifiques aux recruteurs */}
        {isRecruiter && (
          <>
            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Nom de l'entreprise</Text>
              <TextInput
                className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
                placeholder="Nom de votre entreprise"
                value={formData.companyName}
                onChangeText={text => setFormData({ ...formData, companyName: text })}
              />
            </View>

            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Secteur d'activité</Text>
              <TextInput
                className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
                placeholder="Ex: Technologie, Finance, Santé"
                value={formData.companySector}
                onChangeText={text => setFormData({ ...formData, companySector: text })}
              />
            </View>

            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Site web de l'entreprise</Text>
              <TextInput
                className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
                placeholder="https://votre-entreprise.com"
                keyboardType="url"
                autoCapitalize="none"
                value={formData.companyWebsite}
                onChangeText={text => setFormData({ ...formData, companyWebsite: text })}
              />
            </View>

            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-gray-700">Taille de l'entreprise</Text>
              <TextInput
                className="rounded-xl border-2 border-gray-200 bg-white px-4 py-4 text-base text-gray-900"
                placeholder="Ex: 10-50 employés, 50-200 employés"
                value={formData.companySize}
                onChangeText={text => setFormData({ ...formData, companySize: text })}
              />
            </View>
          </>
        )}

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
              <Feather name="save" size={20} color="#FFFFFF" />
              <Text style={{ marginLeft: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' }}>
                Enregistrer les modifications
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

