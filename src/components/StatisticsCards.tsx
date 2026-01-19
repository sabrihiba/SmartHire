import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ApplicationStats } from '@/types/jobApplication';

interface StatisticsCardsProps {
    stats: ApplicationStats;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ stats }) => {
    return (
        <View className="flex-row gap-3">
            {/* Total Applications */}
            <View className="flex-1 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 p-5 shadow-primary-lg border border-primary-400">
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Feather name="briefcase" size={22} color="#FFFFFF" />
                </View>
                <Text className="mb-1 text-3xl font-bold text-white">{stats.total}</Text>
                <Text className="text-xs font-semibold text-primary-100 uppercase tracking-wide">Candidatures</Text>
            </View>

            {/* Interviews */}
            <View className="flex-1 rounded-3xl bg-gradient-to-br from-purple-500 to-purple-600 p-5 shadow-lg border border-purple-400" style={{ shadowColor: '#9333EA', shadowOpacity: 0.3 }}>
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Feather name="users" size={22} color="#FFFFFF" />
                </View>
                <Text className="mb-1 text-3xl font-bold text-white">{stats.interviews}</Text>
                <Text className="text-xs font-semibold text-purple-100 uppercase tracking-wide">Entretiens</Text>
            </View>

            {/* Success Rate */}
            <View className="flex-1 rounded-3xl bg-gradient-to-br from-green-500 to-green-600 p-5 shadow-lg border border-green-400" style={{ shadowColor: '#10B981', shadowOpacity: 0.3 }}>
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                    <Feather name="trending-up" size={22} color="#FFFFFF" />
                </View>
                <Text className="mb-1 text-3xl font-bold text-white">{stats.successRate.toFixed(0)}%</Text>
                <Text className="text-xs font-semibold text-green-100 uppercase tracking-wide">Succès</Text>
            </View>
        </View>
    );
};
