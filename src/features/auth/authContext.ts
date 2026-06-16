import { createContext, useContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export type SignUpMetadata = {
  subscriberLimit: number;
  selectedPlan: string;
};

export type AuthContextValue = {
  isConfigured: boolean;
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ needsEmailConfirmation: boolean }>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
