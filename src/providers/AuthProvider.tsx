import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthState, Credentials, SignupPayload } from '@/types/auth';
import type { User } from '@/types';
import { login as loginService, signup as signupService, logout as logoutService, restoreSession } from '@/services/auth';
import { getUserById } from '@/services/userService';

interface AuthContextValue extends AuthState {
  login: (credentials: Credentials) => Promise<void>;
  signup: (payload: SignupPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    status: 'loading',
    error: null,
  });

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const user = await restoreSession();
        setState((prev) => ({
          ...prev,
          user,
          tokens: user ? { accessToken: 'restored' } : null,
          status: user ? 'authenticated' : 'unauthenticated',
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, status: 'unauthenticated', error: (error as Error).message }));
      }
    };
    bootstrap();
  }, []);

  const login = async (credentials: Credentials) => {
    setState((prev) => ({ ...prev, error: null }));
    const { user, tokens } = await loginService(credentials);
    setState({ user, tokens, status: 'authenticated', error: null });
  };

  const signup = async (payload: SignupPayload) => {
    setState((prev) => ({ ...prev, error: null }));
    const { user, tokens } = await signupService(payload);
    setState({ user, tokens, status: 'authenticated', error: null });
  };

  const logout = async () => {
    await logoutService();
    setState({ user: null, tokens: null, status: 'unauthenticated', error: null });
  };

  const refreshUser = async () => {
    if (!state.user?.id) return;
    try {
      const updatedUser = await getUserById(state.user.id);
      if (updatedUser) {
        setState((prev) => ({
          ...prev,
          user: updatedUser,
        }));
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value = useMemo(
    () => ({
      ...state,
      login,
      signup,
      logout,
      refreshUser,
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

