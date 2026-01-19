import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getDatabase } from './database';

const STORAGE_KEYS = [
  '@job_applications',
  '@users',
  '@jobs',
  '@application_history',
  '@messages',
  '@saved_searches',
  '@notification_settings',
];

// Créer un backup de toutes les données
export const createBackup = async (): Promise<string | null> => {
  try {
    const backupData: any = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: {},
    };

    if (Platform.OS === 'web') {
      // Pour web, utiliser AsyncStorage
      for (const key of STORAGE_KEYS) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          backupData.data[key] = JSON.parse(data);
        }
      }
    } else {
      // Pour mobile, utiliser SQLite + AsyncStorage pour les autres données
      const database = getDatabase();
      
      // Récupérer les données de la base SQLite
      const applications = await database.getAllAsync('SELECT * FROM applications');
      const jobs = await database.getAllAsync('SELECT * FROM jobs');
      const users = await database.getAllAsync('SELECT * FROM users');
      const applicationHistory = await database.getAllAsync('SELECT * FROM application_history');
      const messages = await database.getAllAsync('SELECT * FROM messages');

      backupData.data['@job_applications'] = applications;
      backupData.data['@jobs'] = jobs;
      backupData.data['@users'] = users;
      backupData.data['@application_history'] = applicationHistory;
      backupData.data['@messages'] = messages;

      // Récupérer les autres données depuis AsyncStorage
      for (const key of ['@saved_searches', '@notification_settings']) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          backupData.data[key] = JSON.parse(data);
        }
      }
    }

    const backupJson = JSON.stringify(backupData, null, 2);

    if (Platform.OS === 'web') {
      // Sur web, télécharger le fichier
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_job_tracker_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      Alert.alert('Succès', 'Backup téléchargé');
      return null;
    } else {
      // Sur mobile, sauvegarder et partager
      const fileUri = FileSystem.documentDirectory + `backup_${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, backupJson, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
      }
      return fileUri;
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    Alert.alert('Erreur', 'Impossible de créer le backup');
    throw error;
  }
};

// Restaurer un backup
export const restoreBackup = async (backupJson: string): Promise<boolean> => {
  try {
    const backupData = JSON.parse(backupJson);

    if (!backupData.data) {
      throw new Error('Format de backup invalide');
    }

    if (Platform.OS === 'web') {
      // Pour web, restaurer dans AsyncStorage
      for (const [key, value] of Object.entries(backupData.data)) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
    } else {
      // Pour mobile, restaurer dans SQLite + AsyncStorage
      const database = getDatabase();

      // Restaurer les applications
      if (backupData.data['@job_applications']) {
        await database.runAsync('DELETE FROM applications');
        const applications = backupData.data['@job_applications'];
        for (const app of applications) {
          await database.runAsync(
            `INSERT INTO applications (
              id, title, company, location, jobUrl, contractType, 
              applicationDate, status, notes, documents, cvUrl, cvFileName, jobId, userId, recruiterId, 
              lastFollowUp, followUpCount, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              app.id, app.title, app.company, app.location, app.jobUrl || null,
              app.contractType, app.applicationDate, app.status, app.notes || null,
              app.documents ? JSON.stringify(app.documents) : null,
              app.cvUrl || null, app.cvFileName || null, app.jobId || null,
              app.userId, app.recruiterId || null, app.lastFollowUp || null,
              app.followUpCount || 0, app.createdAt, app.updatedAt,
            ]
          );
        }
      }

      // Restaurer les jobs
      if (backupData.data['@jobs']) {
        await database.runAsync('DELETE FROM jobs');
        const jobs = backupData.data['@jobs'];
        for (const job of jobs) {
          await database.runAsync(
            `INSERT INTO jobs (
              id, title, company, location, type, description, salary, jobUrl,
              postedDate, source, remote, requirements, recruiterId, archived, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              job.id, job.title, job.company, job.location, job.type,
              job.description || null, job.salary || null, job.jobUrl || null,
              job.postedDate, job.source || null, job.remote ? 1 : 0,
              job.requirements ? JSON.stringify(job.requirements) : null,
              job.recruiterId || null, job.archived ? 1 : 0,
              job.createdAt, job.updatedAt,
            ]
          );
        }
      }

      // Restaurer les utilisateurs
      if (backupData.data['@users']) {
        await database.runAsync('DELETE FROM users');
        const users = backupData.data['@users'];
        for (const user of users) {
          await database.runAsync(
            `INSERT INTO users (
              id, name, email, password, role, phone, address, skills, experience, education,
              linkedinUrl, companyName, companySector, companyWebsite, companySize, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              user.id, user.name, user.email, user.password, user.role,
              user.phone || null, user.address || null, user.skills || null,
              user.experience || null, user.education || null, user.linkedinUrl || null,
              user.companyName || null, user.companySector || null,
              user.companyWebsite || null, user.companySize || null,
              user.createdAt, user.updatedAt,
            ]
          );
        }
      }

      // Restaurer les autres données dans AsyncStorage
      for (const key of ['@saved_searches', '@notification_settings']) {
        if (backupData.data[key]) {
          await AsyncStorage.setItem(key, JSON.stringify(backupData.data[key]));
        }
      }
    }

    Alert.alert('Succès', 'Backup restauré avec succès. Veuillez redémarrer l\'application.');
    return true;
  } catch (error) {
    console.error('Error restoring backup:', error);
    Alert.alert('Erreur', 'Impossible de restaurer le backup. Format invalide.');
    return false;
  }
};

