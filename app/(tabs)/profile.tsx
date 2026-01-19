import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { exportProfileToCSV } from '@/services/exportService';
import { Feather } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isCandidate, isRecruiter } = usePermissions();

  const handleLogout = async () => {
    try {
      await logout();
      // Rediriger vers la page de login après la déconnexion
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-white px-6 py-8 border-b border-gray-200">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary-100">
          <Feather name={isRecruiter ? "briefcase" : "user"} size={40} color="#2563EB" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">{user?.name ?? 'Utilisateur'}</Text>
        <Text className="text-gray-600">{user?.email ?? '-'}</Text>
        <View className="mt-2">
          <View className="bg-primary-100 px-3 py-1 rounded-full self-start">
            <Text className="text-xs font-semibold text-primary-700">
              {isRecruiter ? 'Recruteur' : isCandidate ? 'Postulant' : 'Admin'}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-4 mx-4 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
        <View className="mb-4 pb-4 border-b border-gray-100">
          <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Nom</Text>
          <Text className="text-base font-semibold text-gray-900">{user?.name ?? 'Inconnu'}</Text>
        </View>
        <View className="mb-4 pb-4 border-b border-gray-100">
          <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Email</Text>
          <Text className="text-base font-semibold text-gray-900">{user?.email ?? '-'}</Text>
        </View>
        {user?.phone && (
          <View className="mb-4 pb-4 border-b border-gray-100">
            <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Téléphone</Text>
            <Text className="text-base font-semibold text-gray-900">{user.phone}</Text>
          </View>
        )}
        {user?.address && (
          <View className="mb-4 pb-4 border-b border-gray-100">
            <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Adresse</Text>
            <Text className="text-base font-semibold text-gray-900">{user.address}</Text>
          </View>
        )}

        {/* Champs spécifiques aux postulants */}
        {isCandidate && (
          <>
            {user?.skills && user.skills.length > 0 && (
              <View className="mb-4 pb-4 border-b border-gray-100">
                <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Compétences</Text>
                <View className="flex-row flex-wrap gap-2 mt-2">
                  {user.skills.map((skill, index) => (
                    <View key={index} className="bg-primary-100 px-3 py-1 rounded-full">
                      <Text className="text-sm font-medium text-primary-700">{skill}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {user?.experience && (
              <View className="mb-4 pb-4 border-b border-gray-100">
                <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Expérience</Text>
                <Text className="text-base font-semibold text-gray-900">{user.experience}</Text>
              </View>
            )}
            {user?.education && (
              <View className="mb-4 pb-4 border-b border-gray-100">
                <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Formation</Text>
                <Text className="text-base font-semibold text-gray-900">{user.education}</Text>
              </View>
            )}
            {user?.linkedinUrl && (
              <View className="mb-4 pb-4 border-b border-gray-100">
                <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">LinkedIn</Text>
                <Text className="text-base font-semibold text-blue-600">{user.linkedinUrl}</Text>
              </View>
            )}
          </>
        )}

        {/* Champs spécifiques aux recruteurs */}
        {isRecruiter && (
          <>
            {user?.companyName && (
              <View className="mb-4 pb-4 border-b border-gray-100">
                <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Entreprise</Text>
                <Text className="text-base font-semibold text-gray-900">{user.companyName}</Text>
              </View>
            )}
            {user?.companySector && (
              <View className="mb-4 pb-4 border-b border-gray-100">
                <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Secteur</Text>
                <Text className="text-base font-semibold text-gray-900">{user.companySector}</Text>
              </View>
            )}
            {user?.companyWebsite && (
              <View className="mb-4 pb-4 border-b border-gray-100">
                <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Site web</Text>
                <Text className="text-base font-semibold text-blue-600">{user.companyWebsite}</Text>
              </View>
            )}
            {user?.companySize && (
              <View className="mb-4 pb-4 border-b border-gray-100">
                <Text className="mb-1 text-xs text-gray-500 uppercase tracking-wide">Taille de l'entreprise</Text>
                <Text className="text-base font-semibold text-gray-900">{user.companySize}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <View className="px-4 mt-4 mb-4">
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            backgroundColor: '#3B82F6',
            paddingVertical: 20,
            marginBottom: 12,
            shadowColor: '#3B82F6',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
          onPress={() => {
            console.log('Button pressed - Navigating to /profile/edit');
            try {
              router.push('/profile/edit');
              console.log('Navigation called successfully');
            } catch (error) {
              console.error('Navigation error:', error);
              Alert.alert('Erreur', 'Impossible de naviguer vers la page de modification');
            }
          }}
          activeOpacity={0.8}
        >
          <Feather name="edit" size={20} color="#fff" />
          <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Modifier le profil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            backgroundColor: '#10B981',
            paddingVertical: 20,
            marginBottom: 12,
            shadowColor: '#10B981',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
          onPress={async () => {
            if (user) {
              try {
                await exportProfileToCSV(user);
              } catch (error) {
                console.error('Export error:', error);
              }
            }
          }}
          activeOpacity={0.8}
        >
          <Feather name="download" size={20} color="#fff" />
          <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Exporter le profil (CSV)</Text>
        </TouchableOpacity>
      </View>

      <View className="px-4 mt-2 mb-6">
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 16,
            backgroundColor: '#EF4444',
            paddingVertical: 20,
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={20} color="#fff" />
          <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
