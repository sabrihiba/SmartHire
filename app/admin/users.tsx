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
  TextInput,
} from 'react-native';
import { useRouter, useFocusEffect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getAllUsers, updateUserRole, deleteUser } from '@/services/adminService';
import { User, UserRole } from '@/types';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function AdminUsersScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { isAdmin, canManageUsers } = usePermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>(UserRole.CANDIDATE);

  useEffect(() => {
    if (!isAdmin || !canManageUsers) {
      Alert.alert('Accès refusé', 'Seuls les administrateurs peuvent gérer les utilisateurs.');
      router.back();
    }
  }, [isAdmin, canManageUsers]);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      applyFilters(data);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const applyFilters = (data: User[]) => {
    let filtered = data;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  useEffect(() => {
    applyFilters(users);
  }, [roleFilter, searchQuery, users]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleChangeRole = async (userId: string, role: UserRole) => {
    try {
      const success = await updateUserRole(userId, role);
      if (success) {
        Alert.alert('Succès', 'Rôle mis à jour avec succès');
        setShowRoleModal(false);
        loadUsers();
      } else {
        Alert.alert('Erreur', 'Impossible de mettre à jour le rôle');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Erreur', 'Une erreur est survenue');
    }
  };

  const handleDelete = async (user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert('Erreur', 'Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    Alert.alert(
      'Supprimer l\'utilisateur',
      `Êtes-vous sûr de vouloir supprimer ${user.name} ? Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteUser(user.id);
              if (success) {
                Alert.alert('Succès', 'Utilisateur supprimé avec succès');
                loadUsers();
              } else {
                Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
              }
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Erreur', 'Une erreur est survenue');
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return '#9333EA';
      case UserRole.RECRUITER:
        return '#2563EB';
      case UserRole.CANDIDATE:
        return '#16A34A';
      default:
        return '#6B7280';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.RECRUITER:
        return 'Recruteur';
      case UserRole.CANDIDATE:
        return 'Postulant';
      default:
        return role;
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-medium active:scale-[0.98]"
      onPress={() => {
        setSelectedUser(item);
        setNewRole(item.role);
        setShowRoleModal(true);
      }}
      activeOpacity={0.8}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-lg font-bold text-gray-900 mb-1">{item.name}</Text>
          <Text className="text-base text-gray-600 mb-2">{item.email}</Text>
          <View
            className="px-3 py-1.5 rounded-full self-start"
            style={{ backgroundColor: getRoleColor(item.role) + '15' }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: getRoleColor(item.role) }}
            >
              {getRoleLabel(item.role)}
            </Text>
          </View>
        </View>
        {item.id !== currentUser?.id && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
            className="bg-red-50 p-2 rounded-full active:bg-red-100"
          >
            <Feather name="trash-2" size={18} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Gestion des utilisateurs' }} />
      
      {/* Search and Filters */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base text-gray-900 mb-3"
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-full ${
              roleFilter === 'all' ? 'bg-primary-500' : 'bg-gray-100'
            }`}
          >
            <Text className={`text-sm font-semibold ${
              roleFilter === 'all' ? 'text-white' : 'text-gray-700'
            }`}>
              Tous ({users.length})
            </Text>
          </TouchableOpacity>
          {Object.values(UserRole).map(role => {
            const count = users.filter(u => u.role === role).length;
            return (
              <TouchableOpacity
                key={role}
                onPress={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-full ${
                  roleFilter === role ? 'bg-primary-500' : 'bg-gray-100'
                }`}
              >
                <Text className={`text-sm font-semibold ${
                  roleFilter === role ? 'text-white' : 'text-gray-700'
                }`}>
                  {getRoleLabel(role)} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Feather name="users" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-base text-gray-500">
              Aucun utilisateur trouvé
            </Text>
          </View>
        }
      />

      {/* Role Change Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-900">Modifier le rôle</Text>
            <TouchableOpacity onPress={() => setShowRoleModal(false)}>
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {selectedUser && (
            <View className="p-4">
              <Text className="text-base text-gray-600 mb-4">
                Modifier le rôle de {selectedUser.name}
              </Text>
              <View className="gap-3">
                {Object.values(UserRole).map(role => (
                  <TouchableOpacity
                    key={role}
                    className={`p-4 rounded-xl border-2 ${
                      newRole === role
                        ? 'bg-primary-50 border-primary-500'
                        : 'bg-white border-gray-200'
                    }`}
                    onPress={() => setNewRole(role)}
                  >
                    <Text className={`text-base font-semibold ${
                      newRole === role ? 'text-primary-700' : 'text-gray-700'
                    }`}>
                      {getRoleLabel(role)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                className="bg-primary-500 py-4 rounded-xl mt-6 items-center"
                onPress={() => handleChangeRole(selectedUser.id, newRole)}
              >
                <Text className="text-white font-bold text-base">Enregistrer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

