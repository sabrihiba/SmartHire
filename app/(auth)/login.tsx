import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail } from '@/utils';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }

    if (!validateEmail(email)) {
      setError('Email invalide');
      return;
    }

    if (!password) {
      setError('Veuillez entrer votre mot de passe');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setLoading(true);
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (e) {
      setError((e as Error).message || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-10 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
            <Feather name="briefcase" size={32} color="#2563EB" />
          </View>
          <Text className="mb-2 text-3xl font-bold text-gray-900">Connexion</Text>
          <Text className="text-center text-base text-gray-600">
            Connectez-vous pour gérer vos candidatures
          </Text>
        </View>

        <View className="w-full">
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-700">Email</Text>
            <View className={`rounded-xl border-2 bg-gray-50 ${error && !email ? 'border-red-500' : 'border-gray-200'}`}>
              <TextInput
                placeholder="exemple@email.com"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className="px-4 py-4 text-base text-gray-900"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                editable={!loading}
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-700">Mot de passe</Text>
            <View className={`relative rounded-xl border-2 bg-gray-50 ${error && !password ? 'border-red-500' : 'border-gray-200'}`}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                className="px-4 py-4 pr-12 text-base text-gray-900"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                editable={!loading}
              />
              <Pressable
                className="absolute right-3 top-4 p-1"
                onPress={() => setShowPassword(!showPassword)}
              >
                <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          {error ? (
            <View className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4">
              <Text className="text-center text-sm text-red-600">{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={{
              marginBottom: 24,
              borderRadius: 16,
              backgroundColor: '#3B82F6',
              paddingVertical: 20,
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
              opacity: loading ? 0.6 : 1,
            }}
            onPress={onSubmit}
            disabled={loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="log-in" size={20} color="#FFFFFF" />
                <Text style={{ marginLeft: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' }}>Se connecter</Text>
              </View>
            )}
          </Pressable>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-gray-600">Pas encore de compte ? </Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-primary-500">S'inscrire</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
