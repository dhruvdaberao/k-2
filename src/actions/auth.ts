"use server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL);
let ratelimit: Ratelimit | null = null;
if (hasRedis) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '',
    token: process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute for auth actions
    analytics: false,
    ephemeralCache: new Map(),
  });
}

async function checkRateLimit() {
  if (!ratelimit) return true;
  const ip = headers().get("x-forwarded-for") || "127.0.0.1";
  try {
    const { success } = await ratelimit.limit(`auth_action_${ip}`);
    return success;
  } catch (err) {
    console.error("Action rate limit error:", err);
    return true; // fail-open
  }
}
export async function loginAction(email: string, password: string) {
  if (!(await checkRateLimit())) return { success: false, error: "Too many requests. Please try again later." };
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
  if (!(await checkRateLimit())) return { success: false, error: "Too many requests. Please try again later." };
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
  if (!(await checkRateLimit())) return { success: false, error: "Too many requests. Please try again later." };
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
  if (!(await checkRateLimit())) return { success: false, error: "Too many requests. Please try again later." };
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
  if (!(await checkRateLimit())) return { success: false, error: "Too many requests. Please try again later." };
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
