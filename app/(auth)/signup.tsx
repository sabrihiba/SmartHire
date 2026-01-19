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

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userRole, setUserRole] = useState<'recruiter' | 'candidate'>('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async () => {
    console.log('Signup button clicked');
    setError(null);
    
    if (!name.trim()) {
      setError('Veuillez entrer votre nom');
      return;
    }
    
    if (name.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères');
      return;
    }
    
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Email invalide');
      return;
    }
    
    if (!password) {
      setError('Veuillez entrer un mot de passe');
      return;
    }
    
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Calling signup service...');
      await signup({ name: name.trim(), email: email.trim(), password, role: userRole });
      console.log('Signup successful, redirecting...');
      router.replace('/(tabs)');
    } catch (e) {
      console.error('Signup error:', e);
      setError((e as Error).message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
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
            <Feather name="user-plus" size={32} color="#2563EB" />
          </View>
          <Text className="mb-2 text-3xl font-bold text-gray-900">Inscription</Text>
          <Text className="text-center text-base text-gray-600">
            Créez votre compte pour commencer à suivre vos candidatures
          </Text>
        </View>

        <View className="w-full">
          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-700">Nom complet</Text>
            <View className={`rounded-xl border-2 bg-gray-50 ${error && !name ? 'border-red-500' : 'border-gray-200'}`}>
              <TextInput
                placeholder="Jean Dupont"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                className="px-4 py-4 text-base text-gray-900"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError(null);
                }}
                editable={!loading}
              />
            </View>
          </View>

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
            <Text className="mt-1 text-xs text-gray-500">Minimum 6 caractères</Text>
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-700">Confirmer le mot de passe</Text>
            <View className={`relative rounded-xl border-2 bg-gray-50 ${error && !confirmPassword ? 'border-red-500' : 'border-gray-200'}`}>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                className="px-4 py-4 pr-12 text-base text-gray-900"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError(null);
                }}
                editable={!loading}
              />
              <Pressable
                className="absolute right-3 top-4 p-1"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={20} color="#6B7280" />
              </Pressable>
            </View>
          </View>

          <View className="mb-5">
            <Text className="mb-2 text-sm font-semibold text-gray-700">Je suis</Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setUserRole('candidate')}
                className={`flex-1 rounded-xl border-2 py-4 items-center ${
                  userRole === 'candidate'
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Feather
                  name="user"
                  size={24}
                  color={userRole === 'candidate' ? '#fff' : '#6B7280'}
                />
                <Text
                  className={`mt-2 text-sm font-semibold ${
                    userRole === 'candidate' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Postulant
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setUserRole('recruiter')}
                className={`flex-1 rounded-xl border-2 py-4 items-center ${
                  userRole === 'recruiter'
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <Feather
                  name="briefcase"
                  size={24}
                  color={userRole === 'recruiter' ? '#fff' : '#6B7280'}
                />
                <Text
                  className={`mt-2 text-sm font-semibold ${
                    userRole === 'recruiter' ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  Recruteur
                </Text>
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
                <Feather name="user-plus" size={20} color="#FFFFFF" />
                <Text style={{ marginLeft: 8, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#fff' }}>S'inscrire</Text>
              </View>
            )}
          </Pressable>

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-gray-600">Déjà un compte ? </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable>
                <Text className="text-sm font-semibold text-primary-500">Se connecter</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
