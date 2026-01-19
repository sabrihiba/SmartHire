import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getRecruiterStats, RecruiterStats } from '@/services/recruiterService';

interface RecruiterStatsSectionProps {
  userId: string;
}

export const RecruiterStatsSection: React.FC<RecruiterStatsSectionProps> = ({ userId }) => {
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) return;
      try {
        const data = await getRecruiterStats(userId);
        setStats(data);
      } catch (error) {
        console.error('Error loading recruiter stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [userId]);

  if (loading) {
    return (
      <View className="items-center justify-center py-8">
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  }

  if (!stats) return null;

  return (
    <View className="mb-6">
      {/* Stats Cards Row 1 */}
      <View className="flex-row gap-3 mb-3">
        {/* Total Jobs */}
        <View className="flex-1 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 shadow-primary border border-primary-400">
          <View className="mb-2 h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Feather name="briefcase" size={20} color="#FFFFFF" />
          </View>
          <Text className="mb-1 text-2xl font-bold text-white">{stats.totalJobs}</Text>
          <Text className="text-xs font-semibold text-primary-100 uppercase tracking-wide">Offres créées</Text>
        </View>

        {/* Total Applications */}
        <View className="flex-1 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 shadow-lg border border-blue-400" style={{ shadowColor: '#2563EB', shadowOpacity: 0.3 }}>
          <View className="mb-2 h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Feather name="inbox" size={20} color="#FFFFFF" />
          </View>
          <Text className="mb-1 text-2xl font-bold text-white">{stats.totalApplications}</Text>
          <Text className="text-xs font-semibold text-blue-100 uppercase tracking-wide">Candidatures reçues</Text>
        </View>
      </View>

      {/* Stats Cards Row 2 */}
      <View className="flex-row gap-3">
        {/* Pending */}
        <View className="flex-1 rounded-3xl bg-gradient-to-br from-warning-500 to-warning-600 p-4 shadow-lg border border-warning-400" style={{ shadowColor: '#F59E0B', shadowOpacity: 0.3 }}>
          <View className="mb-2 h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Feather name="clock" size={20} color="#FFFFFF" />
          </View>
          <Text className="mb-1 text-2xl font-bold text-white">{stats.pendingApplications}</Text>
          <Text className="text-xs font-semibold text-warning-100 uppercase tracking-wide">En attente</Text>
        </View>

        {/* Interviews */}
        <View className="flex-1 rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 p-4 shadow-lg border border-purple-400" style={{ shadowColor: '#9333EA', shadowOpacity: 0.3 }}>
          <View className="mb-2 h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Feather name="users" size={20} color="#FFFFFF" />
          </View>
          <Text className="mb-1 text-2xl font-bold text-white">{stats.interviewApplications}</Text>
          <Text className="text-xs font-semibold text-purple-100 uppercase tracking-wide">Entretiens</Text>
        </View>
      </View>

      {/* Stats Cards Row 3 */}
      <View className="flex-row gap-3 mt-3">
        {/* Accepted */}
        <View className="flex-1 rounded-3xl bg-gradient-to-br from-success-500 to-success-600 p-4 shadow-lg border border-success-400" style={{ shadowColor: '#10B981', shadowOpacity: 0.3 }}>
          <View className="mb-2 h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Feather name="check-circle" size={20} color="#FFFFFF" />
          </View>
          <Text className="mb-1 text-2xl font-bold text-white">{stats.acceptedApplications}</Text>
          <Text className="text-xs font-semibold text-success-100 uppercase tracking-wide">Acceptées</Text>
        </View>

        {/* Refused */}
        <View className="flex-1 rounded-3xl bg-gradient-to-br from-error-500 to-error-600 p-4 shadow-lg border border-error-400" style={{ shadowColor: '#EF4444', shadowOpacity: 0.3 }}>
          <View className="mb-2 h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Feather name="x-circle" size={20} color="#FFFFFF" />
          </View>
          <Text className="mb-1 text-2xl font-bold text-white">{stats.refusedApplications}</Text>
          <Text className="text-xs font-semibold text-error-100 uppercase tracking-wide">Refusées</Text>
        </View>
      </View>
    </View>
  );
};

