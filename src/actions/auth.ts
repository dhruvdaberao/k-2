"use server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function loginAction(email: string, password: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: { user: data.user, session: data.session } };
}

export async function signupAction(email: string, password: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: { user: data.user, session: data.session } };
}

export async function loginWithOtpAction(email: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function verifyOtpAction(email: string, token: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, data: { user: data.user, session: data.session } };
}

export async function resetPasswordAction(email: string, redirectTo: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function logoutAction() {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
