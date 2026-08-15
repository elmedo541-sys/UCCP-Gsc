import { createContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminSession {
  token: string;
  adminId: string;
  role: string;
  expiresAt: string;
}

interface AuthContextType {
  adminId: string | null;
  role: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  canRegisterMembers: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

const SESSION_KEY = 'admin_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canRegisterMembers, setCanRegisterMembers] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = role === 'super_admin';
  const isEditor = role === 'editor';
  const isViewer = role === 'viewer';

  useEffect(() => {
    // Check for existing session in localStorage
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) {
        setLoading(false);
        return;
      }

      const session: AdminSession = JSON.parse(sessionData);

      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        setLoading(false);
        return;
      }

      // Verify session with backend and fetch fresh role/permissions
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { action: 'whoami', token: session.token },
      });

      if (error || data?.error) {
        localStorage.removeItem(SESSION_KEY);
        setIsAdmin(false);
        setAdminId(null);
        setRole(null);
        setCanRegisterMembers(false);
      } else {
        setIsAdmin(true);
        setAdminId(session.adminId);
        setRole(data.role || session.role || 'super_admin');
        setCanRegisterMembers(!!data.can_register_members);
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
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { username, password, action: 'login' },
      });

      if (error) throw error;

      if (data.error) {
        return { error: new Error(data.error) };
      }

      // Store session in localStorage
      const session: AdminSession = {
        token: data.session_token,
        adminId: data.admin_id,
        role: data.role || 'super_admin',
        expiresAt: data.expires_at,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      setAdminId(data.admin_id);
      setRole(data.role || 'super_admin');
      setCanRegisterMembers(!!data.can_register_members);
      setIsAdmin(true);

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Login failed') };
    }
  };

  const signUp = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-auth', {
        body: { username, password, action: 'signup' },
      });

      if (error) throw error;

      if (data.error) {
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Sign up failed') };
    }
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setAdminId(null);
    setRole(null);
    setIsAdmin(false);
    setCanRegisterMembers(false);
  };

  return (
    <AuthContext.Provider value={{ adminId, role, isAdmin, isSuperAdmin, isEditor, isViewer, canRegisterMembers, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
