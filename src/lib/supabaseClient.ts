import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  if (typeof window === "undefined") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";
    return createClient(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: false,
        }
      }
    );
  }

  const customFetch = (url: string | Request | URL, options?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : (url instanceof Request ? url.url : url.toString());
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
    (window as any).supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: customFetch
        },
        auth: {
          // Bypass navigator.locks entirely. PWAs (especially on iOS/Android) 
          // notoriously deadlock background locks, causing getSession to hang forever.
          lock: async (name: string, acquire: () => Promise<void>) => {
            return await acquire();
          }
        }
      }
    );

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          // Ping session to clear dead sockets on wake
          (window as any).supabaseClient.auth.getSession().catch(() => {
            // Ignore auth token errors on wake
          });
        }
      });
    }
  }
  return (window as any).supabaseClient;
}

export const supabase = getSupabaseClient();
