"use client";

import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/Toast";

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
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          if (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token")) {
            console.warn("Auth: Session expired or token invalid. Clearing local state.");
            setUser(null);
            setSession(null);
            setProfile(null);
            clearAllLocalData();
            showToast("Session expired. Please log in again.");
          } else {
            console.error("Auth Session Error:", error);
          }
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user?.id) fetchProfile(session.user.id);
        }
      })
      .catch(err => {
        console.error("Auth Promise Catch:", err);
        setUser(null);
        setSession(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // Listen for auth changes natively
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        showToast("Logged in successfully");
        setLoading(true); // Show loading briefly while profile syncs
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else if (event === 'SIGNED_OUT') {
        showToast("Logged out successfully");
        setUser(null);
        setProfile(null);
        setSession(null);
        clearAllLocalData();
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    const timeout = setTimeout(() => {
      console.log("🕒 [AUTH] Safety timeout triggered");
      setLoading(false);
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // We will no longer show a full-screen blocker here to avoid jarring flashes on every page load.
  // Consumers can use the 'loading' flag to show their own subtle spinners/placeholders.

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
