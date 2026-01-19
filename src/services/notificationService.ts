import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  statusChanges: boolean;
  reminders: boolean;
  newMessages: boolean;
  reminderDays: number; // Nombre de jours avant rappel
}

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Demander les permissions
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // Configuration pour Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Obtenir les paramètres de notifications
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  try {
    const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Valeurs par défaut
    return {
      enabled: true,
      statusChanges: true,
      reminders: true,
      newMessages: true,
      reminderDays: 7,
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      enabled: true,
      statusChanges: true,
      reminders: true,
      newMessages: true,
      reminderDays: 7,
    };
  }
};

// Sauvegarder les paramètres de notifications
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
};

// Planifier une notification de rappel
export const scheduleReminderNotification = async (
  applicationId: string,
  title: string,
  company: string,
  daysFromNow: number
): Promise<string | null> => {
  try {
    const settings = await getNotificationSettings();
    if (!settings.enabled || !settings.reminders) {
      return null;
    }

    const trigger = new Date();
    trigger.setDate(trigger.getDate() + daysFromNow);
    trigger.setHours(9, 0, 0, 0); // 9h du matin

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rappel de relance',
        body: `N'oubliez pas de relancer ${company} pour le poste "${title}"`,
        data: { applicationId, type: 'reminder' },
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling reminder notification:', error);
    return null;
  }
};

// Envoyer une notification de changement de statut
export const sendStatusChangeNotification = async (
  title: string,
  company: string,
  newStatus: string
): Promise<void> => {
  try {
    const settings = await getNotificationSettings();
    if (!settings.enabled || !settings.statusChanges) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Changement de statut',
        body: `Votre candidature chez ${company} pour "${title}" est maintenant: ${newStatus}`,
        data: { type: 'status_change' },
      },
      trigger: null, // Immédiat
    });
  } catch (error) {
    console.error('Error sending status change notification:', error);
  }
};

// Envoyer une notification de nouveau message
export const sendNewMessageNotification = async (
  senderName: string,
  message: string
): Promise<void> => {
  try {
    const settings = await getNotificationSettings();
    if (!settings.enabled || !settings.newMessages) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Nouveau message',
        body: `${senderName}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
        data: { type: 'new_message' },
      },
      trigger: null, // Immédiat
    });
  } catch (error) {
    console.error('Error sending new message notification:', error);
  }
};

// Annuler une notification planifiée
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

// Annuler toutes les notifications
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

