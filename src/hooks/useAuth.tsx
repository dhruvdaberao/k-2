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
  const initDone = useRef(false);

  // Safe wrapper: always resolves, never throws, never hangs
  const fetchProfile = async (uid: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      const json = await res.json();
      setProfile(json.profile || null);
    } catch (err) {
      console.warn("Auth: fetchProfile failed, continuing without profile:", err);
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
        if (mounted) {
          initDone.current = true;
          setLoading(false);
        }
      }
    };

    init();

    // Listen for auth changes — but ONLY act on real user actions (sign in/out),
    // never interfere with the initial load controlled by init() above.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (!mounted) return;

      if (session) {
        setSession(session);
        setUser(session.user);
      }
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        // If init already finished, this is a real sign-in (e.g. user just logged in).
        // Fetch profile and ensure loading is false.
        fetchProfile(session.user.id).finally(() => {
          if (mounted && !initDone.current) {
            initDone.current = true;
            setLoading(false);
          }
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSession(null);
        clearAllLocalData();
        initDone.current = true;
        setLoading(false);
      }
      // For TOKEN_REFRESHED, INITIAL_SESSION, etc. — do NOT touch loading.
      // Let init() handle the initial load. These events just update session/user above.
    });

    // Absolute safety net — loading can NEVER stay stuck longer than 15 seconds
    const safetyTimeout = setTimeout(() => {
      if (!initDone.current) {
        console.warn("🕒 [AUTH] Safety timeout triggered — forcing loading=false");
        initDone.current = true;
        setLoading(false);
      }
    }, 15000);

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
