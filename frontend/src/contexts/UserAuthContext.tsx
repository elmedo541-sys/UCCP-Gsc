import { createContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserSession {
  token: string;
  personId: string;
  expiresAt: string;
}

interface UserAuthContextType {
  personId: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export { UserAuthContext };

const SESSION_KEY = 'user_session';

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [personId, setPersonId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) {
        setLoading(false);
        return;
      }

      const session: UserSession = JSON.parse(sessionData);
      
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('verify_user_session', {
        p_token: session.token,
      });

      if (error || !data?.[0]?.is_valid) {
        localStorage.removeItem(SESSION_KEY);
        setIsLoggedIn(false);
        setPersonId(null);
      } else {
        setIsLoggedIn(true);
        setPersonId(session.personId);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('user-auth', {
        body: { username, password, action: 'login' },
      });

      if (error) throw error;

      if (data.error) {
        return { error: new Error(data.error) };
      }

      const session: UserSession = {
        token: data.session_token,
        personId: data.person_id,
        expiresAt: data.expires_at,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      setPersonId(data.person_id);
      setIsLoggedIn(true);

      // Log login activity
      try {
        // Fetch person's name for the log
        const { data: personData } = await supabase
          .from('people')
          .select('full_name')
          .eq('uuid', data.person_id)
          .maybeSingle();

        await supabase.from('user_activity_log').insert({
          person_id: data.person_id,
          full_name: personData?.full_name ?? null,
          username: username,
          action: 'login',
        });
      } catch {
        // Non-critical: don't fail login if logging fails
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Login failed') };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setPersonId(null);
    setIsLoggedIn(false);
  };

  return (
    <UserAuthContext.Provider value={{ personId, isLoggedIn, loading, signIn, signOut }}>
      {children}
    </UserAuthContext.Provider>
  );
}
