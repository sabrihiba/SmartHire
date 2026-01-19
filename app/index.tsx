import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

export default function Index() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/(tabs)');
    } else if (status === 'unauthenticated') {
      router.replace('/(auth)/login');
    }
  }, [status, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}


