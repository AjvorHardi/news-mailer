import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, requireSupabaseClient, supabase } from '../../lib/supabase/client';
import { AuthContext, type SignUpMetadata } from './authContext';

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }

      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      isConfigured: isSupabaseConfigured,
      isLoading,
      isPasswordRecovery,
      session,
      user: session?.user ?? null,
      signIn: async (email: string, password: string) => {
        const client = requireSupabaseClient();
        const { error } = await client.auth.signInWithPassword({ email, password });

        if (error) {
          throw error;
        }
      },
      signOut: async () => {
        const client = requireSupabaseClient();
        const { error } = await client.auth.signOut();

        if (error) {
          throw error;
        }
      },
      signUp: async (email: string, password: string, metadata: SignUpMetadata, emailRedirectTo: string) => {
        const client = requireSupabaseClient();
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
            emailRedirectTo,
          },
        });

        if (error) {
          throw error;
        }

        return { needsEmailConfirmation: !data.session };
      },
      requestPasswordReset: async (email: string, redirectTo: string) => {
        const client = requireSupabaseClient();
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo,
        });

        if (error) {
          throw error;
        }
      },
      updatePassword: async (password: string) => {
        const client = requireSupabaseClient();
        const { error } = await client.auth.updateUser({ password });

        if (error) {
          throw error;
        }
      },
    }),
    [isLoading, isPasswordRecovery, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
