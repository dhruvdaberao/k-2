"use client";

import { supabase } from "@/lib/supabaseClient";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import { syncLocalCartToDB } from "@/lib/cartSupabase";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      router.replace("/profile");
    }
  }, [user, router, authLoading]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail) {
      showToast("Email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      showToast("Enter valid email");
      return;
    }
    if (authMode !== "forgot" && !authPassword) {
      showToast("Password is required");
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
            setSuccessModal(true);
            setTimeout(() => {
              setSuccessModal(false);
              router.replace("/profile");
            }, 2000);
          }
        }
      } else if (authMode === "login") {
        if (!authPassword) throw new Error("Please enter a password");

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password");
          } else if (error.message.includes("Email not confirmed")) {
            throw new Error("Please verify your email first");
          } else {
            throw error;
          }
        }

        showToast("Logged in successfully");

        if (data.user?.id) {
          await syncLocalCartToDB(data.user.id);
        }

        setTimeout(() => {
          router.replace("/profile");
        }, 1500);
        return;
      } else if (authMode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (error) throw error;
        showToast("Check your email for reset link.");
        setAuthMode("login");
      }
    } catch (err: any) {
      showToast(err.message || "Login failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Eye icon SVGs
  const EyeOpen = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const EyeClosed = (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

  return (
    <>
      <main className="checkout-page checkout-container pb-20 signup-page-styles" style={{ minHeight: 'calc(100vh - 180px)', paddingTop: '80px' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .login-page-styles input {
            border: 1px solid rgba(139, 94, 60, 0.4) !important;
            transition: border-color 0.2s ease;
          }
          .login-page-styles input:focus {
            border-color: var(--brand) !important;
            outline: none;
            box-shadow: 0 0 0 1px var(--brand);
          }
        `}} />
        <div className="w-full mx-auto mt-6 sm:mt-10" style={{ maxWidth: '460px' }}>
          <div className="text-center mb-4">

            <h1 className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
              {authMode === "login" ? "Welcome Back" : authMode === "signup" ? "Create an Account" : "Reset Password"}
            </h1>
          </div>

          <div className="checkout-card p-5 sm:p-6 bg-[#f3ede6] rounded-2xl shadow-sm" style={{ border: "1.5px solid rgba(139, 94, 60, 0.3)" }}>
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
                      style={{ paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                    >
                      {showPassword ? EyeClosed : EyeOpen}
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
    </>
  );
}
