import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';
import { initDatabase } from '@/services/database';
import { View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useThemeStore } from '@/store/themeStore';
import '@/config/nativewind'; // Configurer NativeWind en premier
import '../global.css';

const DatabaseInitializer = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDatabase();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsReady(true); // Continue anyway
      }
    };
    initialize();
  }, []);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <>{children}</>;
};

export default function RootLayout() {
  const { isDark } = useThemeStore();

  return (
    <SafeAreaProvider>
      <DatabaseInitializer>
        <AuthProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="application/new" options={{ title: 'Nouvelle candidature', presentation: 'modal' }} />
            <Stack.Screen name="application/[id]" options={{ title: 'Détails' }} />
            <Stack.Screen name="application/[id]/edit" options={{ title: 'Modifier' }} />
            <Stack.Screen name="job/new" options={{ title: 'Nouvelle offre', presentation: 'modal' }} />
            <Stack.Screen name="job/[id]" options={{ title: 'Détails de l\'offre' }} />
            <Stack.Screen name="job/[id]/edit" options={{ title: 'Modifier l\'offre' }} />
            <Stack.Screen name="recruiter/applications" options={{ title: 'Candidatures reçues' }} />
            <Stack.Screen name="recruiter/jobs" options={{ title: 'Mes offres' }} />
            <Stack.Screen name="profile/edit" options={{ title: 'Modifier le profil' }} />
            <Stack.Screen name="admin/dashboard" options={{ title: 'Dashboard Admin' }} />
            <Stack.Screen name="admin/users" options={{ title: 'Gestion des utilisateurs' }} />
            <Stack.Screen name="admin/jobs" options={{ title: 'Gestion des offres' }} />
            <Stack.Screen name="admin/applications" options={{ title: 'Gestion des candidatures' }} />
          </Stack>
        </AuthProvider>
      </DatabaseInitializer>
    </SafeAreaProvider>
  );
}

