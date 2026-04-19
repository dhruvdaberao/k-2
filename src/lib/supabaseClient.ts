import { createClient } from "@supabase/supabase-js";

// Check for required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials are not fully configured in the environment variables.");
}

// Ensure the client is only created if we have both keys, otherwise pass dummy values 
// to prevent crash during build time if envs are missing (though warning will show)
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseKey || "placeholder-key"
);
