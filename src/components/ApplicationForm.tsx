import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { JobApplication, ApplicationStatus } from '../types/jobApplication';
import { createApplication } from '../services/jobApplication';
import { createMessage } from '../services/messageService';
import { useAuth } from '../hooks/useAuth';
import { Colors } from '../constants';
import { validateEmail } from '../utils';

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  recruiterId?: string;
  company: string;
  location: string;
  onSubmitSuccess?: (application: JobApplication) => void;
  onCancel?: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId,
  jobTitle,
  recruiterId,
  company,
  location,
  onSubmitSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    applicantName: user?.name || '',
    applicantEmail: user?.email || '',
    applicantPhone: '',
    coverLetter: '',
    linkedInUrl: '',
    portfolioUrl: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.applicantName.trim()) {
      newErrors.applicantName = 'Name is required';
    }

    if (!formData.applicantEmail.trim()) {
      newErrors.applicantEmail = 'Email is required';
    } else if (!validateEmail(formData.applicantEmail)) {
      newErrors.applicantEmail = 'Please enter a valid email address';
    }

    if (!formData.applicantPhone.trim()) {
      newErrors.applicantPhone = 'Phone number is required';
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.applicantPhone)) {
      newErrors.applicantPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to apply.');
      return;
    }

    setIsSubmitting(true);

    try {
      // @ts-ignore - Application type vs JobApplication type mismatch in imports, but structure is compatible for Firestore
      const applicationData = {
        jobId,
        title: jobTitle,
        company: company,
        location: location,
        userId: user.id,
        recruiterId: recruiterId,
        applicantName: formData.applicantName.trim(),
        applicantEmail: formData.applicantEmail.trim(),
        applicantPhone: formData.applicantPhone.trim(),
        coverLetter: formData.coverLetter.trim() || undefined,
        linkedInUrl: formData.linkedInUrl.trim() || undefined,
        portfolioUrl: formData.portfolioUrl.trim() || undefined,
        documents: [],
        status: ApplicationStatus.TO_APPLY, // Default status
        applicationDate: new Date().toISOString(),
        contractType: 'CDI', // Default - ideally passed as prop too
      };

      // We need to match JobApplication interface.
      // Ideally we pass the whole Job object to ApplicationForm.

      // Let's rely on flexible types for now but switch to robust implementation.
      // Code below tries to map to what createApplication expects.

      // Note: createApplication expects JobApplication Omit id/dates.
      // JobApplication has: title, company, location, contractType.

      const submittedApplication = await createApplication({
        ...applicationData,
        status: ApplicationStatus.SENT,
      } as any);

      // Create initial message with cover letter if provided
      if (formData.coverLetter.trim() && submittedApplication.id) {
        try {
          await createMessage({
            applicationId: submittedApplication.id,
            senderId: user.id,
            senderRole: 'candidate',
            message: formData.coverLetter.trim(),
          });
        } catch (error) {
          console.error('Error creating initial message:', error);
          // Don't fail the application if message creation fails
        }
      }

      onSubmitSuccess?.(submittedApplication as any);
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Submission Failed',
        error instanceof Error ? error.message : 'Failed to submit application. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Apply for {jobTitle}</Text>
      <Text style={styles.subtitle}>Please fill out the form below to apply</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={[styles.input, errors.applicantName && styles.inputError]}
          placeholder="Enter your full name"
          value={formData.applicantName}
          onChangeText={(value) => updateField('applicantName', value)}
          editable={!isSubmitting}
        />
        {errors.applicantName && <Text style={styles.errorText}>{errors.applicantName}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={[styles.input, errors.applicantEmail && styles.inputError]}
          placeholder="your.email@example.com"
          value={formData.applicantEmail}
          onChangeText={(value) => updateField('applicantEmail', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isSubmitting}
        />
        {errors.applicantEmail && <Text style={styles.errorText}>{errors.applicantEmail}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={[styles.input, errors.applicantPhone && styles.inputError]}
          placeholder="+1 (555) 123-4567"
          value={formData.applicantPhone}
          onChangeText={(value) => updateField('applicantPhone', value)}
          keyboardType="phone-pad"
          editable={!isSubmitting}
        />
        {errors.applicantPhone && <Text style={styles.errorText}>{errors.applicantPhone}</Text>}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Cover Letter</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us why you're interested in this position..."
          value={formData.coverLetter}
          onChangeText={(value) => updateField('coverLetter', value)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>LinkedIn Profile (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://linkedin.com/in/yourprofile"
          value={formData.linkedInUrl}
          onChangeText={(value) => updateField('linkedInUrl', value)}
          keyboardType="url"
          autoCapitalize="none"
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Portfolio/Website (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="https://yourportfolio.com"
          value={formData.portfolioUrl}
          onChangeText={(value) => updateField('portfolioUrl', value)}
          keyboardType="url"
          autoCapitalize="none"
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.buttonContainer}>
        {onCancel && (
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, styles.submitButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <Text style={styles.submitButtonText}>Submit Application</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: Colors.background,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: Colors.primary,
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
