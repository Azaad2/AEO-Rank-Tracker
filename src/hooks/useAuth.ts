import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { posthog } from '@/lib/posthog';
import { readSignupIntent, clearSignupIntent, markAccountCreatedFired, getAcquisitionSource } from '@/lib/attribution';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

interface AuthActions {
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        try {
          if (session?.user) {
            posthog.identify(session.user.id, {
              email: session.user.email,
              provider: session.user.app_metadata?.provider,
            });
          } else {
            posthog.reset();
          }
        } catch (error) {
          console.debug('PostHog identify failed:', error);
        }

        // Fire account_created exactly once per fresh signup (covers OAuth too).
        if (event === 'SIGNED_IN' && session?.user) {
          const u = session.user;
          const createdAt = u.created_at ? new Date(u.created_at).getTime() : 0;
          const isFresh = createdAt > 0 && Date.now() - createdAt < 5 * 60 * 1000;
          if (isFresh && markAccountCreatedFired(u.id)) {
            const intent = readSignupIntent();
            const sessionId = (() => {
              try { return sessionStorage.getItem('tracking_session_id'); } catch { return null; }
            })();
            const payload = {
              event_type: 'account_created',
              event_metadata: {
                source_page: intent?.source_page ?? null,
                scan_id: intent?.scan_id ?? (() => { try { return localStorage.getItem('pendingScanId'); } catch { return null; } })(),
                industry_id: null as string | null,
                plan: 'free',
                signup_method: u.app_metadata?.provider || 'email',
                acquisition_source: intent?.acquisition_source ?? getAcquisitionSource(),
                timestamp: new Date().toISOString(),
                user_id: u.id,
              },
              session_id: sessionId,
              user_agent: navigator.userAgent,
            };
            supabase.from('user_activity').insert(payload).then(({ error }) => {
              if (error) console.debug('account_created insert failed:', error);
            });
            try {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'account_created', payload.event_metadata);
              }
              posthog.capture('account_created', payload.event_metadata);
            } catch {}
            clearSignupIntent();
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };
}
