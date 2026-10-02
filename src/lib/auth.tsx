import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { supabase } from './supabase';

export type Role = 'homeowner' | 'pro';

export interface Profile {
  id: string;
  role: Role;
  fullName: string | null;
  email: string | null;
}

interface AuthState {
  /** True until the stored session (and its profile) has been read. */
  isLoading: boolean;
  profile: Profile | null;
  /** True when Supabase isn't configured and the user is in a local, unsaved demo session. */
  isDemo: boolean;
  signIn(email: string, password: string): Promise<void>;
  /** Resolves `needsConfirmation: true` when the project requires email confirmation first. */
  signUp(input: { email: string; password: string; fullName: string; role: Role }): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;
  /** Demo mode only: sign in locally as the given role. */
  startDemo(role: Role): void;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

export const isSupabaseConfigured = supabase !== null;

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setLoading] = useState(isSupabaseConfigured);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDemo, setDemo] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    const apply = async (session: Session | null) => {
      const next = session ? await loadProfile(session) : null;
      if (!active) return;
      setProfile(next);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION is handled by getSession above; token refreshes don't change the profile.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        // Defer: Supabase warns against awaiting its own calls inside this callback.
        setTimeout(() => apply(session), 0);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signUp = useCallback<AuthState['signUp']>(async ({ email, password, fullName, role }) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    // The handle_new_user trigger (supabase/migrations) copies role and name into public.profiles.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { role, full_name: fullName.trim() } },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    if (isDemo) {
      setDemo(false);
      setProfile(null);
      return;
    }
    await supabase?.auth.signOut();
  }, [isDemo]);

  const startDemo = useCallback((role: Role) => {
    if (supabase) return;
    setDemo(true);
    setProfile({ id: 'demo', role, fullName: role === 'pro' ? 'Demo Lawn Co.' : 'Demo homeowner', email: null });
  }, []);

  const value = useMemo(
    () => ({ isLoading, profile, isDemo, signIn, signUp, signOut, startDemo }),
    [isLoading, profile, isDemo, signIn, signUp, signOut, startDemo],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function loadProfile(session: Session): Promise<Profile> {
  const user = session.user;
  const { data } = await supabase!
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();
  // Fall back to sign-up metadata if the profile row isn't readable yet (e.g. migration not applied).
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    role: data?.role === 'pro' || (!data && meta.role === 'pro') ? 'pro' : 'homeowner',
    fullName: data?.full_name ?? meta.full_name ?? null,
    email: user.email ?? null,
  };
}
