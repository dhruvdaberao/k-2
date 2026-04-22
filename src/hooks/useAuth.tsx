"use client";

import { supabase } from "@/lib/supabaseClient";

import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";

import { clearAllLocalData } from "@/lib/bags";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    setProfile(data || null);
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) fetchProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes natively
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        setLoading(true); // Show loading briefly while profile syncs
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSession(null);
        clearAllLocalData();
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  if (loading && !session) {
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#F5EFE6', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e6ded4', borderTop: '4px solid #5a3e2b', borderRadius: '50%', animation: 'auth-spin 0.8s linear infinite' }} />
        <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
