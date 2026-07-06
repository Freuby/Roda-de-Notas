import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';
import { Profile } from '../types';

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,first_name,last_name,email,created_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erreur profil:', error);
      setProfile(null);
    } else {
      setProfile(data as Profile);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);

      if (currentSession) {
        fetchProfile(currentSession.user.id);
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else {
        setProfile(null);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setLoading(false);
      if (initialSession) {
        fetchProfile(initialSession.user.id);
        if (location.pathname === '/login') {
          navigate('/');
        }
      } else if (!initialSession && location.pathname !== '/login') {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, fetchProfile]);

  return (
    <SessionContext.Provider value={{ session, loading, profile }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
