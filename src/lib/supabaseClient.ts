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

  if (!(window as any).supabaseClient) {
    (window as any).supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }
  return (window as any).supabaseClient;
}

export const supabase = getSupabaseClient();
