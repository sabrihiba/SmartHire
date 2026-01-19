import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getAdminStats } from '@/services/adminService';
import { UserRole } from '@/types';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.back();
      return;
    }
    loadStats();
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (!isAdmin) {
    return null;
  }

  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Dashboard Admin' }} />
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <View className="p-4">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Bienvenue, {user?.name}
            </Text>
            <Text className="text-gray-600">Vue d'ensemble de la plateforme</Text>
          </View>

          {/* Statistiques principales */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Statistiques globales</Text>
            <View className="flex-row flex-wrap gap-4">
              <View className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 flex-1 min-w-[150px] shadow-primary-lg">
                <Feather name="users" size={24} color="#FFFFFF" />
                <Text className="text-white text-3xl font-bold mt-2">{stats.totalUsers}</Text>
                <Text className="text-blue-100 text-sm font-medium mt-1">Utilisateurs</Text>
              </View>

              <View className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 flex-1 min-w-[150px] shadow-primary-lg">
                <Feather name="briefcase" size={24} color="#FFFFFF" />
                <Text className="text-white text-3xl font-bold mt-2">{stats.totalJobs}</Text>
                <Text className="text-green-100 text-sm font-medium mt-1">Offres</Text>
              </View>

              <View className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 flex-1 min-w-[150px] shadow-primary-lg">
                <Feather name="file-text" size={24} color="#FFFFFF" />
                <Text className="text-white text-3xl font-bold mt-2">{stats.totalApplications}</Text>
                <Text className="text-purple-100 text-sm font-medium mt-1">Candidatures</Text>
              </View>
            </View>
          </View>

          {/* Répartition par rôle */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Utilisateurs par rôle</Text>
            <View className="bg-white rounded-2xl p-4 shadow-medium">
              <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-blue-500 mr-3" />
                  <Text className="text-gray-700 font-medium">Recruteurs</Text>
                </View>
                <Text className="text-gray-900 font-bold">{stats.totalRecruiters}</Text>
              </View>
              <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                  <Text className="text-gray-700 font-medium">Postulants</Text>
                </View>
                <Text className="text-gray-900 font-bold">{stats.totalCandidates}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-purple-500 mr-3" />
                  <Text className="text-gray-700 font-medium">Admins</Text>
                </View>
                <Text className="text-gray-900 font-bold">{stats.usersByRole[UserRole.ADMIN] || 0}</Text>
              </View>
            </View>
          </View>

          {/* Actions rapides */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-4">Actions rapides</Text>
            <View className="gap-3">
              <TouchableOpacity
                className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-medium active:scale-[0.98]"
                onPress={() => router.push('/admin/users')}
              >
                <View className="flex-row items-center">
                  <View className="bg-blue-100 rounded-xl p-3 mr-4">
                    <Feather name="users" size={20} color="#2563EB" />
                  </View>
                  <View>
                    <Text className="text-gray-900 font-bold text-base">Gérer les utilisateurs</Text>
                    <Text className="text-gray-500 text-sm">Voir et modifier les utilisateurs</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-medium active:scale-[0.98]"
                onPress={() => router.push('/admin/jobs')}
              >
                <View className="flex-row items-center">
                  <View className="bg-green-100 rounded-xl p-3 mr-4">
                    <Feather name="briefcase" size={20} color="#16A34A" />
                  </View>
                  <View>
                    <Text className="text-gray-900 font-bold text-base">Gérer les offres</Text>
                    <Text className="text-gray-500 text-sm">Voir toutes les offres d'emploi</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-medium active:scale-[0.98]"
                onPress={() => router.push('/admin/applications')}
              >
                <View className="flex-row items-center">
                  <View className="bg-purple-100 rounded-xl p-3 mr-4">
                    <Feather name="file-text" size={20} color="#9333EA" />
                  </View>
                  <View>
                    <Text className="text-gray-900 font-bold text-base">Gérer les candidatures</Text>
                    <Text className="text-gray-500 text-sm">Voir toutes les candidatures</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

