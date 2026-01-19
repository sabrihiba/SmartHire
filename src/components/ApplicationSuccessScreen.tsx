import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { JobApplication } from '../types/jobApplication';
import { Colors } from '../constants';

interface ApplicationSuccessScreenProps {
  application: JobApplication;
  jobTitle: string;
}

export const ApplicationSuccessScreen: React.FC<ApplicationSuccessScreenProps> = ({
  application,
  jobTitle,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
        <Text style={styles.title}>Application Submitted!</Text>
        <Text style={styles.subtitle}>
          Your application for {jobTitle} has been submitted successfully.
        </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Application ID:</Text>
            <Text style={styles.detailValue}>{application.id}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, styles.statusValue]}>
              {application.status?.toUpperCase() || 'PENDING'}
            </Text>
          </View>
          {application.applicationDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted:</Text>
              <Text style={styles.detailValue}>
                {new Date(application.applicationDate).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.message}>
          You will receive a confirmation email shortly. We'll review your application and get back to you soon.
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/(tabs)/applications')}
        >
          <Text style={styles.primaryButtonText}>View My Applications</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
        >
          <Text style={styles.secondaryButtonText}>Back to Jobs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkmark: {
    fontSize: 48,
    color: Colors.background,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  statusValue: {
    color: Colors.primary,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: Colors.border,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
