"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import FullPageLoader from "@/components/ui/FullPageLoader";

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("HYDRATED SESSION:", data.session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          console.log("User is now available:", session.user);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // We no longer block the entire app with a FullPageLoader.
  // This prevents 'constant loading' issues if Supabase takes time to respond.
  // Auth state is handled gracefully in useAuth() hook.
  return <>{children}</>;
}
