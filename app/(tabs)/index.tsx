import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { Feather } from '@expo/vector-icons';
import { getApplicationStats, getApplications, getApplicationsByRecruiter } from '@/services/jobApplication';
import { getJobsByRecruiter } from '@/services/jobService';
import { JobApplication, ApplicationStats, ApplicationStatus } from '@/types/jobApplication';
import { Job } from '@/types/job';
import DonutChart from '@/components/DonutChart';
import BarChart from '@/components/BarChart';



export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 768;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [candidateStats, setCandidateStats] = useState<ApplicationStats | null>(null);
  const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
  const [recruiterJobs, setRecruiterJobs] = useState<Job[]>([]);
  const [recruiterJobStats, setRecruiterJobStats] = useState({ active: 0, archived: 0, total: 0, totalCandidates: 0 });

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      if (user.role === UserRole.CANDIDATE) {
        const stats = await getApplicationStats(user.id);
        setCandidateStats(stats);
        const apps = await getApplications(user.id);
        setRecentApplications(apps);
      } else if (user.role === UserRole.RECRUITER) {
        const [jobs, applications] = await Promise.all([
          getJobsByRecruiter(user.id),
          getApplicationsByRecruiter(user.id)
        ]);

        setRecruiterJobs(jobs);
        const active = jobs.filter((j: Job) => !j.archived).length;
        const archived = jobs.filter((j: Job) => j.archived).length;
        setRecruiterJobStats({
          active,
          archived,
          total: jobs.length,
          totalCandidates: applications.length
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Helper component for KPI Cards
  const KpiCard = ({
    icon,
    label,
    value,
    color,
    bgColor
  }: {
    icon: keyof typeof Feather.glyphMap;
    label: string;
    value: string | number;
    color: string;
    bgColor: string;
  }) => (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIconContainer, { backgroundColor: bgColor }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <View style={styles.kpiContent}>
        <Text style={styles.kpiLabel}>{label.toUpperCase()}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>
    </View>
  );

  const renderCandidateView = () => {
    // Donut Data
    const donutData = candidateStats ? [
      { value: candidateStats.byStatus[ApplicationStatus.SENT] || 0, color: '#3B82F6', label: 'En attente' }, // Blue
      { value: candidateStats.byStatus[ApplicationStatus.ACCEPTED] || 0, color: '#10B981', label: 'Acceptées' }, // Green
      { value: candidateStats.byStatus[ApplicationStatus.REFUSED] || 0, color: '#EF4444', label: 'Refusées' }, // Red
      { value: candidateStats.interviews || 0, color: '#F59E0B', label: 'Entretiens' }, // Orange
    ].filter(d => d.value > 0) : [];

    if (donutData.length === 0) donutData.push({ value: 1, color: '#E5E7EB', label: 'Aucune donnée' });

    // Bar Data (Mocked for Evolution visualisation as we don't have historical snapshots)
    const barData = [
      { label: 'Jan', value: 2 },
      { label: 'Fév', value: 5 },
      { label: 'Mar', value: 3 },
      { label: 'Avr', value: 8 },
      { label: 'Mai', value: candidateStats?.total || 0 }, // Current month real data roughly
    ];

    return (
      <View style={styles.dashboardGrid}>
        {/* Top KPI Row */}
        <View style={styles.kpiRow}>
          <KpiCard
            icon="file-text"
            label="Candidatures"
            value={candidateStats?.total || 0}
            color="#10B981"
            bgColor="#D1FAE5"
          />
          <KpiCard
            icon="check-circle"
            label="Acceptées"
            value={candidateStats?.byStatus[ApplicationStatus.ACCEPTED] || 0}
            color="#3B82F6"
            bgColor="#DBEAFE"
          />
          <KpiCard
            icon="calendar"
            label="Entretiens"
            value={candidateStats?.interviews || 0}
            color="#6366F1"
            bgColor="#E0E7FF"
          />
          <KpiCard
            icon="alert-circle"
            label="Refusées"
            value={candidateStats?.byStatus[ApplicationStatus.REFUSED] || 0}
            color="#EF4444"
            bgColor="#FEE2E2"
          />
        </View>

        {/* Charts Row */}
        <View style={[styles.chartsRow, { flexDirection: isLargeScreen ? 'row' : 'column' }]}>
          {/* Bar Chart Card */}
          <View style={[styles.chartCard, styles.barChartCard]}>
            <View style={styles.chartHeader}>
              <View style={[styles.chartIcon, { backgroundColor: '#EDE9FE' }]}>
                <Feather name="bar-chart-2" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.chartTitle}>Évolution des Candidatures</Text>
            </View>
            <BarChart data={barData} height={200} barColor="#A78BFA" />
          </View>

          {/* Donut Chart Card */}
          <View style={[styles.chartCard, styles.donutChartCard]}>
            <View style={styles.chartHeader}>
              <View style={[styles.chartIcon, { backgroundColor: '#EDE9FE' }]}>
                <Feather name="pie-chart" size={20} color="#8B5CF6" />
              </View>
              <Text style={styles.chartTitle}>Distribution par Statut</Text>
            </View>
            <View style={styles.donutContainer}>
              <DonutChart
                data={donutData}
                radius={80}
                strokeWidth={25}
                centerValue={candidateStats?.total || 0}
              />
              {/* Legend */}
              <View style={styles.legendContainer}>
                {donutData.map((item, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Recent Activity List */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Activités Récentes</Text>
          {recentApplications.slice(0, 5).map(app => (
            <View key={app.id} style={styles.listItem}>
              <View style={styles.listIcon}>
                <Feather name="briefcase" size={20} color="#6B7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{app.title}</Text>
                <Text style={styles.listSubtitle}>{app.company}</Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#F3F4F6', borderRadius: 12 }}>
                <Text style={{ fontSize: 12, color: '#374151' }}>{new Date(app.applicationDate).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderRecruiterView = () => {


    return (
      <View style={styles.dashboardGrid}>
        {/* Top KPI Row */}
        <View style={styles.kpiRow}>
          <KpiCard
            icon="briefcase"
            label="Offres Publiées"
            value={recruiterJobStats.total}
            color="#10B981"
            bgColor="#D1FAE5"
          />
          <KpiCard
            icon="activity"
            label="Offres Actives"
            value={recruiterJobStats.active}
            color="#3B82F6"
            bgColor="#DBEAFE"
          />
          <KpiCard
            icon="archive"
            label="Archivées"
            value={recruiterJobStats.archived}
            color="#F59E0B"
            bgColor="#FEF3C7"
          />
          <KpiCard
            icon="users"
            label="Candidats Total"
            value={recruiterJobStats.totalCandidates}
            color="#EF4444"
            bgColor="#FEE2E2"
          />
        </View>

        {/* Action Buttons Row */}
        <View style={{ gap: 16 }}>
          {/* Create Offer Action */}
          <TouchableOpacity
            onPress={() => router.push('/job/new')}
            activeOpacity={0.9}
            style={{
              backgroundColor: Colors.primary,
              borderRadius: 24,
              padding: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
              overflow: 'hidden',
            }}
          >
            {/* Decorative circles */}
            <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ position: 'absolute', bottom: -40, left: -10, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' }} />

            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
                Publier une offre
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 }}>
                Créez une nouvelle annonce pour trouver vos futurs talents dès maintenant.
              </Text>
            </View>

            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Feather name="plus" size={24} color="white" />
            </View>
          </TouchableOpacity>

          {/* View Applications Action */}
          <TouchableOpacity
            onPress={() => router.push('/recruiter/applications')}
            activeOpacity={0.9}
            style={{
              backgroundColor: Colors.secondary,
              borderRadius: 24,
              padding: 24,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              shadowColor: Colors.secondary,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
              overflow: 'hidden',
            }}
          >
            {/* Decorative circles */}
            <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <View style={{ position: 'absolute', bottom: -40, left: -10, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)' }} />

            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
                Candidatures
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 20 }}>
                Consultez et gérez les candidatures reçues pour vos offres d'emploi.
              </Text>
            </View>

            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Feather name="users" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity List */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Offres Récentes</Text>
          {recruiterJobs.slice(0, 5).map(job => (
            <View key={job.id} style={styles.listItem}>
              <View style={styles.listIcon}>
                <Feather name="briefcase" size={20} color="#6B7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.listTitle}>{job.title}</Text>
                <Text style={styles.listSubtitle}>{job.location} • {job.type}</Text>
              </View>
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#F3F4F6', borderRadius: 12 }}>
                <Text style={{ fontSize: 12, color: '#374151' }}>{new Date(job.createdAt || job.postedDate).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Tableau de bord</Text>
        <Text style={styles.pageSubtitle}>Bienvenue, voici un aperçu de l'activité.</Text>
      </View>

      {user?.role === UserRole.CANDIDATE && renderCandidateView()}
      {user?.role === UserRole.RECRUITER && renderRecruiterView()}
      {user?.role === UserRole.ADMIN && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Bienvenue Admin</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Reference: Light grey bg
  },
  contentContainer: {
    padding: 24,
    paddingTop: Platform.OS === 'web' ? 24 : 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  dashboardGrid: {
    gap: 24,
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150, // Wrap on small screens
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'column', // Icon top-left, text below
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  kpiIconContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  kpiContent: {},
  kpiLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  chartsRow: {
    gap: 24,
  },
  chartCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  barChartCard: {
    // minHeight: 400,
  },
  donutChartCard: {
    // minHeight: 400,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  chartIcon: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  donutContainer: {
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  recentSection: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  listSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: { alignItems: 'center', padding: 20 },
  emptyText: { color: 'gray' },
});
