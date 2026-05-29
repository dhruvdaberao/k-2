import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  if (typeof window === "undefined") {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        }
      }
    );
  }

  const customFetch = (url: string | Request | URL, options?: RequestInit) => {
    const urlString = url.toString();
    const isStorage = urlString.includes('/storage/v1/');
    const timeoutDuration = isStorage ? 60000 : 10000; // 60s for uploads, 10s for auth/db

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    return fetch(url, { ...options, signal: controller.signal })
      .then((res) => {
        clearTimeout(timeoutId);
        return res;
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        throw err;
      });
  };

  if (!(window as any).supabaseClient) {
    (window as any).supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        global: {
          fetch: customFetch
        }
      }
    );

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // Ping session to clear dead sockets on wake
          (window as any).supabaseClient.auth.getSession();
        }
      });
    }
  }
  return (window as any).supabaseClient;
}

export const supabase = getSupabaseClient();
