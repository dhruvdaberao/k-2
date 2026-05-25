"use client";

import { supabase } from "@/lib/supabaseClient";

import { createContext, useContext, useEffect, useState, useRef } from "react";
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
  const loadingDone = useRef(false);

  // Safe wrapper: always resolves, never throws, never hangs
  const fetchProfile = async (uid: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()
        .abortSignal(controller.signal);
      clearTimeout(timeout);
      setProfile(data || null);
    } catch (err) {
      console.warn("Auth: fetchProfile failed, continuing without profile:", err);
      // Don't throw — let loading finish gracefully
    }
  };

  const finishLoading = () => {
    if (!loadingDone.current) {
      loadingDone.current = true;
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          if (error.message.includes("refresh_token_not_found") || error.message.includes("Invalid Refresh Token")) {
            console.warn("Auth: Token issue detected.");
          } else if (error.message.includes("Lock")) {
            console.warn("Auth: Benign lock error from another tab.");
          } else {
            console.error("Auth Session Error:", error);
          }
        }

        if (session) {
          setSession(session);
          setUser(session.user);
          if (session.user.id) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (err: any) {
        if (err?.message?.includes("Lock")) {
          console.warn("Auth: Benign lock error caught.");
        } else {
          console.error("Auth Promise Catch:", err);
        }
      } finally {
        if (mounted) finishLoading();
      }
    };

    init();

    // Listen for auth changes natively
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (!mounted) return;

      if (session) {
        setSession(session);
        setUser(session.user);
      }
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        // Do not set loading to true here. It causes the app to flash a loading screen
        // or get stuck when switching tabs and Supabase fires a background session refresh.
        fetchProfile(session.user.id).finally(() => {
          if (mounted) finishLoading();
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSession(null);
        clearAllLocalData();
        finishLoading();
      } else {
        finishLoading();
      }
    });

    // Absolute safety net — loading can NEVER stay stuck longer than 3 seconds
    const safetyTimeout = setTimeout(() => {
      console.warn("🕒 [AUTH] Safety timeout triggered — forcing loading=false");
      finishLoading();
    }, 3000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
