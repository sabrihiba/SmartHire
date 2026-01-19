import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import { EvolutionChart } from './EvolutionChart';
import { getRecruiterStats, RecruiterStats } from '@/services/recruiterService';
import { getJobsByRecruiter } from '@/services/jobService';
import { getApplicationsByRecruiter } from '@/services/jobApplication';
import { Job } from '@/types/job';
import { JobApplication } from '@/types/jobApplication';
import { Feather } from '@expo/vector-icons';

interface RecruiterAdvancedStatsProps {
  userId: string;
}

export const RecruiterAdvancedStats: React.FC<RecruiterAdvancedStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [evolution, setEvolution] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [statsData, jobsData, applicationsData] = await Promise.all([
        getRecruiterStats(userId),
        getJobsByRecruiter(userId),
        getApplicationsByRecruiter(userId),
      ]);
      
      setStats(statsData);
      setJobs(jobsData);
      setApplications(applicationsData);

      // Calculer l'évolution temporelle
      const evolutionMap = new Map<string, number>();
      applicationsData.forEach(app => {
        const date = new Date(app.applicationDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        evolutionMap.set(monthKey, (evolutionMap.get(monthKey) || 0) + 1);
      });

      const evolutionData = Array.from(evolutionMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-6); // Derniers 6 mois

      setEvolution(evolutionData);

      // Calculer les statistiques avancées
      const totalApplications = applicationsData.length;
      const respondedApplications = applicationsData.filter(
        app => app.status !== 'Envoyée'
      ).length;
      const responseRate = totalApplications > 0 
        ? (respondedApplications / totalApplications) * 100 
        : 0;

      // Temps moyen de traitement (en jours)
      const processedApps = applicationsData.filter(
        app => app.status !== 'Envoyée' && app.updatedAt
      );
      let avgProcessingTime = 0;
      if (processedApps.length > 0) {
        const totalDays = processedApps.reduce((sum, app) => {
          const appliedDate = new Date(app.applicationDate);
          const updatedDate = new Date(app.updatedAt);
          const days = Math.floor((updatedDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avgProcessingTime = Math.round(totalDays / processedApps.length);
      }

      // Top 5 des offres les plus populaires
      const jobApplicationCounts = new Map<string, number>();
      applicationsData.forEach(app => {
        if (app.jobId) {
          jobApplicationCounts.set(app.jobId, (jobApplicationCounts.get(app.jobId) || 0) + 1);
        }
      });

      const topJobs = Array.from(jobApplicationCounts.entries())
        .map(([jobId, count]) => {
          const job = jobsData.find(j => j.id === jobId);
          return { job, count };
        })
        .filter(item => item.job)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTopJobs(topJobs);
      setResponseRate(responseRate);
      setAvgProcessingTime(avgProcessingTime);
    } catch (error) {
      console.error('Error loading advanced stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const [topJobs, setTopJobs] = useState<{ job: Job | undefined; count: number }[]>([]);
  const [responseRate, setResponseRate] = useState(0);
  const [avgProcessingTime, setAvgProcessingTime] = useState(0);

  if (loading) {
    return (
      <View className="items-center justify-center py-8">
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  }

  if (!stats) return null;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Évolution temporelle */}
      {evolution.length > 0 && (
        <View className="mb-6">
          <EvolutionChart
            data={evolution}
            title="Évolution des candidatures reçues"
          />
        </View>
      )}

      {/* Statistiques avancées */}
      <View className="bg-white p-5 rounded-3xl shadow-medium border border-gray-100 mb-6">
        <Text className="text-lg font-bold text-gray-900 mb-4">Statistiques avancées</Text>
        
        <View className="gap-4">
          {/* Taux de réponse */}
          <View className="flex-row items-center justify-between p-4 bg-blue-50 rounded-xl">
            <View className="flex-row items-center">
              <Feather name="percent" size={20} color="#2563EB" />
              <Text className="ml-3 text-base font-semibold text-gray-900">Taux de réponse</Text>
            </View>
            <Text className="text-xl font-bold text-blue-600">{responseRate.toFixed(1)}%</Text>
          </View>

          {/* Temps moyen de traitement */}
          <View className="flex-row items-center justify-between p-4 bg-green-50 rounded-xl">
            <View className="flex-row items-center">
              <Feather name="clock" size={20} color="#10B981" />
              <Text className="ml-3 text-base font-semibold text-gray-900">Temps moyen de traitement</Text>
            </View>
            <Text className="text-xl font-bold text-green-600">{avgProcessingTime} jour{avgProcessingTime > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Top 5 des offres */}
      {topJobs.length > 0 && (
        <View className="bg-white p-5 rounded-3xl shadow-medium border border-gray-100">
          <Text className="text-lg font-bold text-gray-900 mb-4">Top 5 des offres les plus populaires</Text>
          <View className="gap-3">
            {topJobs.map((item, index) => (
              <View
                key={item.job?.id || index}
                className="flex-row items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <View className="flex-1 mr-3">
                  <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                    {item.job?.title || 'Offre supprimée'}
                  </Text>
                  <Text className="text-sm text-gray-600">{item.job?.company}</Text>
                </View>
                <View className="flex-row items-center">
                  <Feather name="users" size={16} color="#6B7280" />
                  <Text className="ml-2 text-base font-bold text-primary-600">{item.count}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

