import type { User } from './index';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error?: string | null;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface SignupPayload extends Credentials {
  name: string;
  role: 'recruiter' | 'candidate';
}

