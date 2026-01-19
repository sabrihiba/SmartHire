import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermissions,
  NotificationSettings,
} from '@/services/notificationService';
import { createBackup } from '@/services/backupService';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function SettingsScreen() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    statusChanges: true,
    reminders: true,
    newMessages: true,
    reminderDays: 7,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await getNotificationSettings();
      setSettings(savedSettings);
      
      // Demander les permissions si les notifications sont activées
      if (savedSettings.enabled) {
        await requestNotificationPermissions();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveNotificationSettings(newSettings);
    
    // Si on active les notifications, demander les permissions
    if (key === 'enabled' && value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permissions requises',
          'Les notifications nécessitent votre autorisation pour fonctionner.'
        );
        setSettings({ ...newSettings, enabled: false });
        await saveNotificationSettings({ ...newSettings, enabled: false });
      }
    }
  };

  const updateReminderDays = async (days: number) => {
    await updateSetting('reminderDays', days);
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <Text className="text-gray-600">Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Paramètres' }} />
      
      <View className="px-4 py-6">
        {/* Section Notifications */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4">
            <Feather name="bell" size={24} color={Colors.primary} />
            <Text className="ml-3 text-xl font-bold text-gray-900">Notifications</Text>
          </View>

          {/* Activer/Désactiver toutes les notifications */}
          <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">Activer les notifications</Text>
              <Text className="text-sm text-gray-500 mt-1">
                Recevoir des notifications pour les événements importants
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={(value) => updateSetting('enabled', value)}
              trackColor={{ false: '#D1D5DB', true: Colors.primary + '80' }}
              thumbColor={settings.enabled ? Colors.primary : '#F3F4F6'}
            />
          </View>

          {settings.enabled && (
            <>
              {/* Changements de statut */}
              <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Changements de statut</Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    Notifier quand un recruteur change le statut de votre candidature
                  </Text>
                </View>
                <Switch
                  value={settings.statusChanges}
                  onValueChange={(value) => updateSetting('statusChanges', value)}
                  trackColor={{ false: '#D1D5DB', true: Colors.primary + '80' }}
                  thumbColor={settings.statusChanges ? Colors.primary : '#F3F4F6'}
                />
              </View>

              {/* Rappels de relance */}
              <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Rappels de relance</Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    Rappel automatique pour relancer les recruteurs
                  </Text>
                </View>
                <Switch
                  value={settings.reminders}
                  onValueChange={(value) => updateSetting('reminders', value)}
                  trackColor={{ false: '#D1D5DB', true: Colors.primary + '80' }}
                  thumbColor={settings.reminders ? Colors.primary : '#F3F4F6'}
                />
              </View>

              {/* Nouveaux messages */}
              <View className="flex-row items-center justify-between py-4 border-b border-gray-100">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">Nouveaux messages</Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    Notifier quand vous recevez un nouveau message
                  </Text>
                </View>
                <Switch
                  value={settings.newMessages}
                  onValueChange={(value) => updateSetting('newMessages', value)}
                  trackColor={{ false: '#D1D5DB', true: Colors.primary + '80' }}
                  thumbColor={settings.newMessages ? Colors.primary : '#F3F4F6'}
                />
              </View>

              {/* Jours avant rappel */}
              {settings.reminders && (
                <View className="py-4">
                  <Text className="text-base font-semibold text-gray-900 mb-3">
                    Jours avant rappel de relance
                  </Text>
                  <View className="flex-row gap-2">
                    {[3, 7, 14, 30].map((days) => (
                      <TouchableOpacity
                        key={days}
                        onPress={() => updateReminderDays(days)}
                        className={`px-4 py-2 rounded-full ${
                          settings.reminderDays === days
                            ? 'bg-primary-500'
                            : 'bg-gray-100'
                        }`}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            settings.reminderDays === days
                              ? 'text-white'
                              : 'text-gray-700'
                          }`}
                        >
                          {days} jour{days > 1 ? 's' : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Section Informations */}
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-4">
            <Feather name="info" size={24} color={Colors.primary} />
            <Text className="ml-3 text-xl font-bold text-gray-900">Informations</Text>
          </View>
          
          <View className="py-2">
            <Text className="text-sm text-gray-600">
              Version: 1.0.0
            </Text>
            <Text className="text-sm text-gray-600 mt-2">
              Connecté en tant que: {user?.name || 'Utilisateur'}
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Rôle: {user?.role === 'ADMIN' ? 'Administrateur' : user?.role === 'RECRUITER' ? 'Recruteur' : 'Postulant'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
