import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { Job, JobType } from '@/types/job';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface JobListProps {
  jobs: Job[];
  onJobPress?: (job: Job) => void;
  emptyMessage?: string;
}

const JobTypeLabels: Record<JobType, string> = {
  [JobType.FULL_TIME]: 'Temps plein',
  [JobType.PART_TIME]: 'Temps partiel',
  [JobType.CONTRACT]: 'Contrat',
  [JobType.INTERNSHIP]: 'Stage',
  [JobType.FREELANCE]: 'Freelance',
  [JobType.TEMPORARY]: 'Temporaire',
};

export const JobList: React.FC<JobListProps> = ({
  jobs,
  onJobPress,
  emptyMessage = 'Aucune offre d\'emploi trouvée',
}) => {
  const handleJobPress = (job: Job) => {
    if (onJobPress) {
      onJobPress(job);
    } else {
      // Par défaut, ouvrir le lien de l'offre
      Linking.openURL(job.jobUrl).catch(err =>
        console.error('Error opening URL:', err)
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  };

  const renderJobCard = ({ item }: { item: Job }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleJobPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.companyName}>{item.company}</Text>
          </View>
          {item.remote && (
            <View style={styles.remoteBadge}>
              <Feather name="home" size={12} color={Colors.primary} />
              <Text style={styles.remoteText}>Remote</Text>
            </View>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>

          <View style={styles.infoRow}>
            <Feather name="briefcase" size={14} color={Colors.textSecondary} />
            <Text style={styles.infoText}>
              {JobTypeLabels[item.type]}
            </Text>
          </View>

          {item.salary && (
            <View style={styles.infoRow}>
              <Feather name="dollar-sign" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{item.salary}</Text>
            </View>
          )}

          {item.source && (
            <View style={styles.infoRow}>
              <Feather name="external-link" size={14} color={Colors.textSecondary} />
              <Text style={styles.sourceText}>{item.source}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.postedDate}>{formatDate(item.postedDate)}</Text>
          <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={jobs}
      renderItem={renderJobCard}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Feather name="briefcase" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  remoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  remoteText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardBody: {
    marginBottom: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sourceText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  postedDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
});

