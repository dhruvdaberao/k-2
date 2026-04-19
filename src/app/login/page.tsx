"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/Toast";
import { syncLocalCartToDB } from "@/lib/cartSupabase";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) {
      showToast("Please enter an email address.");
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        if (!authPassword || authPassword.length < 6) throw new Error("Password must be at least 6 characters");
        if (authPassword !== authConfirmPassword) throw new Error("Passwords do not match");
        
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        
        if (error) throw error;

        if (data?.user?.identities && data.user.identities.length === 0) {
          throw new Error("This email address is already registered. Please login.");
        }

        if (data?.user?.id) {
          if (!data.session) {
            showToast("Verification email sent. Please check your inbox.");
            setAuthMode("login");
          } else {
            await syncLocalCartToDB(data.user.id);
            showToast("Account created successfully!");
            router.push("/");
          }
        }
      } else if (authMode === "login") {
        if (!authPassword) throw new Error("Please enter a password");
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        
        if (error) throw error;
        
        if (data.user?.id) {
          await syncLocalCartToDB(data.user.id);
        }
        
        showToast("Login Successful! Welcome back.");
        router.push("/"); // STEP 2: HOME PAGE REDIRECT
      } else if (authMode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
          redirectTo: "https://keshvicrafts-2.vercel.app/reset-password"
        });
        if (error) throw error;
        showToast("Check your email for reset link.");
        setAuthMode("login");
      }
    } catch (err: any) {
      showToast(err.message || "An unexpected error occurred.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <main className="checkout-page checkout-container pb-20 pt-[120px]" style={{ paddingTop: '120px' }}>
      <div className="mx-auto w-full" style={{ maxWidth: '380px', marginTop: '40px' }}>
        <div className="text-center mb-8">
          <img src="/uploads/hero/logo.png" alt="Logo" className="mx-auto mb-4" style={{ height: '110px', width: 'auto', mixBlendMode: 'multiply' }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
            {authMode === "login" ? "Welcome Back" : authMode === "signup" ? "Create an Account" : "Reset Password"}
          </h1>
        </div>

        <div className="checkout-card p-6 shadow-sm">
          <form onSubmit={handleAuthAction} className="flex flex-col gap-4">
            <label className="checkout-field">
              <span>Email Address</span>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full border p-2 rounded"
              />
            </label>

            {authMode !== "forgot" && (
              <label className="checkout-field">
                <span>Password</span>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full border p-2 rounded"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="auth-show-btn">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            )}

            {authMode === "signup" && (
              <label className="checkout-field">
                <span>Confirm Password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={authConfirmPassword}
                  onChange={(e) => setAuthConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border p-2 rounded"
                  required
                />
              </label>
            )}

            <button type="submit" className="btn-primary w-full py-3 mt-2" disabled={authLoading}>
              {authLoading ? "Processing..." : authMode === "login" ? "Login" : authMode === "signup" ? "Create Account" : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-3 text-sm">
            {authMode === "login" ? (
              <>
                <button type="button" onClick={() => setAuthMode("forgot")} className="auth-link-btn">Forgot Password?</button>
                <p className="text-stone-500">Don't have an account? <button type="button" onClick={() => setAuthMode("signup")} className="auth-link-btn font-bold text-[var(--brand)]">Sign Up</button></p>
              </>
            ) : (
              <button type="button" onClick={() => setAuthMode("login")} className="auth-link-btn font-bold text-[var(--brand)]">Back to Login</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
