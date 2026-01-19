import { Platform } from 'react-native';
import { JobApplication } from '@/types/jobApplication';
import { Job } from '@/types/job';
import { User } from '@/types';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

// Convertir des données en CSV
const convertToCSV = (data: any[], headers: string[]): string => {
  const csvRows: string[] = [];
  
  // Headers
  csvRows.push(headers.join(','));
  
  // Data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Échapper les virgules et guillemets
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

// Export des candidatures en CSV
export const exportApplicationsToCSV = async (
  applications: JobApplication[],
  filename: string = 'candidatures'
): Promise<void> => {
  try {
    const headers = [
      'Titre',
      'Entreprise',
      'Lieu',
      'Type de contrat',
      'Date de candidature',
      'Statut',
      'Date de dernière relance',
      'Nombre de relances',
      'Notes',
    ];

    const csvData = applications.map(app => ({
      'Titre': app.title,
      'Entreprise': app.company,
      'Lieu': app.location,
      'Type de contrat': app.contractType,
      'Date de candidature': new Date(app.applicationDate).toLocaleDateString('fr-FR'),
      'Statut': app.status,
      'Date de dernière relance': app.lastFollowUp ? new Date(app.lastFollowUp).toLocaleDateString('fr-FR') : '',
      'Nombre de relances': app.followUpCount || 0,
      'Notes': app.notes || '',
    }));

    const csv = convertToCSV(csvData, headers);
    
    if (Platform.OS === 'web') {
      // Sur web, télécharger le fichier
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      Alert.alert('Succès', 'Fichier CSV téléchargé');
    } else {
      // Sur mobile, sauvegarder et partager
      const fileUri = FileSystem.documentDirectory + `${filename}_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
    }
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    Alert.alert('Erreur', 'Impossible d\'exporter en CSV');
    throw error;
  }
};

// Export des offres en CSV (pour recruteurs)
export const exportJobsToCSV = async (
  jobs: Job[],
  filename: string = 'offres'
): Promise<void> => {
  try {
    const headers = [
      'Titre',
      'Entreprise',
      'Lieu',
      'Type',
      'Salaire',
      'Date de publication',
      'Source',
      'Télétravail',
      'Archivée',
    ];

    const csvData = jobs.map(job => ({
      'Titre': job.title,
      'Entreprise': job.company,
      'Lieu': job.location,
      'Type': job.type,
      'Salaire': job.salary || '',
      'Date de publication': new Date(job.postedDate).toLocaleDateString('fr-FR'),
      'Source': job.source || '',
      'Télétravail': job.remote ? 'Oui' : 'Non',
      'Archivée': job.archived ? 'Oui' : 'Non',
    }));

    const csv = convertToCSV(csvData, headers);
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      Alert.alert('Succès', 'Fichier CSV téléchargé');
    } else {
      const fileUri = FileSystem.documentDirectory + `${filename}_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
    }
  } catch (error) {
    console.error('Error exporting jobs to CSV:', error);
    Alert.alert('Erreur', 'Impossible d\'exporter en CSV');
    throw error;
  }
};

// Export du profil utilisateur
export const exportProfileToCSV = async (user: User): Promise<void> => {
  try {
    const headers = ['Champ', 'Valeur'];
    const profileData = [
      { 'Champ': 'Nom', 'Valeur': user.name },
      { 'Champ': 'Email', 'Valeur': user.email },
      { 'Champ': 'Rôle', 'Valeur': user.role },
      { 'Champ': 'Téléphone', 'Valeur': user.phone || '' },
      { 'Champ': 'Adresse', 'Valeur': user.address || '' },
    ];

    if (user.skills) {
      profileData.push({ 'Champ': 'Compétences', 'Valeur': Array.isArray(user.skills) ? user.skills.join(', ') : user.skills });
    }
    if (user.experience) {
      profileData.push({ 'Champ': 'Expérience', 'Valeur': user.experience });
    }
    if (user.education) {
      profileData.push({ 'Champ': 'Formation', 'Valeur': user.education });
    }
    if (user.linkedinUrl) {
      profileData.push({ 'Champ': 'LinkedIn', 'Valeur': user.linkedinUrl });
    }
    if (user.companyName) {
      profileData.push({ 'Champ': 'Entreprise', 'Valeur': user.companyName });
    }
    if (user.companySector) {
      profileData.push({ 'Champ': 'Secteur', 'Valeur': user.companySector });
    }

    const csv = convertToCSV(profileData, headers);
    
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `profil_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      Alert.alert('Succès', 'Profil exporté en CSV');
    } else {
      const fileUri = FileSystem.documentDirectory + `profil_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
    }
  } catch (error) {
    console.error('Error exporting profile:', error);
    Alert.alert('Erreur', 'Impossible d\'exporter le profil');
    throw error;
  }
};


