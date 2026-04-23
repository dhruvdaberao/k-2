
export async function testEnv() {
  console.log("ANON_KEY:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  console.log("SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log("BREVO_KEY:", !!process.env.KeshviCraftsOrders);
}
testEnv();
