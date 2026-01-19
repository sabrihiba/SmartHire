import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Job } from '../../src/types/job';
import { JobApplication, ApplicationStatus } from '../../src/types/jobApplication';
import { ApplicationForm, ApplicationSuccessScreen } from '../../src/components';
import { Colors } from '../../src/constants';
import { getJobById } from '../../src/services/jobService';
import { getApplications } from '../../src/services/jobApplication';
import { usePermissions } from '../../src/hooks/usePermissions';
import { useAuth } from '../../src/hooks/useAuth';
import { StatusConfig } from '../../src/constants';
import { Ionicons } from '@expo/vector-icons';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isRecruiter } = usePermissions();
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<JobApplication | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const [existingApplication, setExistingApplication] = useState<JobApplication | null>(null);

  useEffect(() => {
    const loadJobAndApplication = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [fetchedJob] = await Promise.all([getJobById(id)]);
        setJob(fetchedJob);

        if (user && !isRecruiter) {
          const userApps = await getApplications(user.id);
          const found = userApps.find(app => app.jobId === id);
          if (found) {
            setExistingApplication(found as any);
          }
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadJobAndApplication();
  }, [id, user, isRecruiter, submittedApplication]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (submittedApplication) {
    return (
      <ApplicationSuccessScreen
        application={submittedApplication}
        jobTitle={job.title}
      />
    );
  }

  if (showApplicationForm) {
    return (
      <ApplicationForm
        jobId={job.id}
        jobTitle={job.title}
        recruiterId={job.recruiterId}
        company={job.company}
        location={job.location}
        onSubmitSuccess={(application) => {
          setShowApplicationForm(false);
          setSubmittedApplication(application);
        }}
        onCancel={() => setShowApplicationForm(false)}
      />
    );
  }

  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.companyLogoPlaceholder}>
            <Text style={styles.companyInitials}>{getCompanyInitials(job.company)}</Text>
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>

          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.tagText}>{job.location} {job.remote && '(Remote)'}</Text>
            </View>
            <View style={styles.tag}>
              <Ionicons name="briefcase-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.tagText}>{job.type}</Text>
            </View>
            {job.salary && (
              <View style={styles.tag}>
                <Ionicons name="cash-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.tagText}>{job.salary}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.dateText}>Posted {new Date(job.postedDate).toLocaleDateString()}</Text>
            {job.applicationDeadline && (
              <>
                <Text style={styles.dateSeparator}>•</Text>
                <Text style={styles.dateText}>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</Text>
              </>
            )}
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.sectionContent}>{job.description}</Text>
        </View>

        {/* Requirements Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {(job.requirements || []).map((requirement, index) => (
            <View key={index} style={styles.listItem}>
              <View style={styles.bulletPoint} />
              <Text style={styles.listText}>{requirement}</Text>
            </View>
          ))}
        </View>

        {/* Benefits Section */}
        {job.benefits && job.benefits.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            {job.benefits.map((benefit, index) => (
              <View key={index} style={styles.listItem}>
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.success} style={styles.checkIcon} />
                <Text style={styles.listText}>{benefit}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom spacer to account for fixed footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Footer */}
      {!isRecruiter && (
        <View style={styles.footer}>
          {existingApplication ? (
            <View style={[styles.statusBanner, {
              backgroundColor: (StatusConfig[existingApplication.status]?.color || Colors.textSecondary) + '15',
              borderColor: (StatusConfig[existingApplication.status]?.color || Colors.textSecondary) + '30'
            }]}>
              <Ionicons
                name={
                  existingApplication.status === ApplicationStatus.ACCEPTED ? 'checkmark-circle' :
                    existingApplication.status === ApplicationStatus.REFUSED ? 'close-circle' :
                      'hourglass'
                }
                size={20}
                color={StatusConfig[existingApplication.status]?.color || Colors.textSecondary}
              />
              <Text style={[styles.statusText, { color: StatusConfig[existingApplication.status]?.color || Colors.textSecondary }]}>
                Status: {StatusConfig[existingApplication.status]?.label || existingApplication.status}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.applyButton}
              activeOpacity={0.8}
              onPress={() => setShowApplicationForm(true)}
            >
              <Text style={styles.applyButtonText}>Apply Now</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Slightly gray background for modern look
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 + 60 : 100, // Account for transparent header
  },
  backButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 24,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  companyLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3E8EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  companyInitials: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 32,
  },
  company: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
    marginVertical: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dateSeparator: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  sectionContent: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 9,
    marginRight: 12,
  },
  checkIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
