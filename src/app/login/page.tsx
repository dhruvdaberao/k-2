"use client";

import { supabase } from "@/lib/supabaseClient";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import { syncLocalCartToDB } from "@/lib/cartSupabase";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace("/profile");
    }
  }, [user, router]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!authEmail || (authMode !== "forgot" && !authPassword)) {
      const msg = "Please fill all fields";
      setErrorMsg(msg);
      showToast(msg);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authEmail)) {
      const msg = "Enter valid email";
      setErrorMsg(msg);
      showToast(msg);
      return;
    }

    setAuthLoading(true);

    try {
      if (authMode === "signup") {
        if (!authPassword || authPassword.length < 6) {
          const msg = "Password too weak (min 6 characters)";
          setErrorMsg(msg);
          showToast(msg);
          setAuthLoading(false);
          return;
        }
        if (authPassword !== authConfirmPassword) {
          const msg = "Passwords do not match";
          setErrorMsg(msg);
          showToast(msg);
          setAuthLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });

        if (error) {
          let message = error.message;
          if (message.includes("already registered")) {
            message = "Account already exists";
          }
          setErrorMsg(message);
          showToast(message);
          setAuthLoading(false);
          return;
        }

        if (data?.user?.identities && data.user.identities.length === 0) {
          const msg = "This email address is already registered. Please login.";
          setErrorMsg(msg);
          showToast(msg);
          setAuthLoading(false);
          return;
        }

        if (data?.user?.id) {
          if (!data.session) {
            showToast("Verification email sent. Please check your inbox.");
            setAuthMode("login");
          } else {
            await syncLocalCartToDB(data.user.id);
            showToast("Account created successfully");
            setSuccessModal(true);
            setTimeout(() => {
              setSuccessModal(false);
              router.replace("/profile");
            }, 2000);
          }
        }
      } else if (authMode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });

        if (error) {
          let message = "Login failed";
          if (error.message.includes("Invalid login credentials")) {
            message = "Invalid email or password";
          } else if (error.message.includes("Email not confirmed")) {
            message = "Please verify your email first";
          } else {
            message = error.message;
          }
          setErrorMsg(message);
          showToast(message);
          setAuthLoading(false);
          return;
        }

        showToast("Logged in successfully");

        if (data.user?.id) {
          await syncLocalCartToDB(data.user.id);
        }

        setSuccessModal(true);
        setTimeout(() => {
          setSuccessModal(false);
          router.replace("/profile");
        }, 2000);
      } else if (authMode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
          redirectTo: `${window.location.origin}/account-settings?reset=true`
        });
        if (error) throw error;
        setSuccessMsg("Reset link sent your mail successfully");
        showToast("✅ Reset link shared to your mail successfully");
        // Page stays here as requested
      }
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred. Please try again.";
      setErrorMsg(msg);
      showToast(msg);
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
      {/* Success Modal */}
      {successModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '36px 32px', maxWidth: 340, width: '90%', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#388e3c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#2f2a26', margin: '0 0 6px', fontFamily: 'Georgia, serif' }}>Welcome Back!</h3>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Successfully logged into your account</p>
          </div>
        </div>
      )}

      <main className="checkout-page checkout-container pb-20 pt-[120px]" style={{ paddingTop: '120px' }}>
        <div className="px-4 sm:px-6 md:px-0 max-w-md mx-auto w-full mt-10">
          <div className="text-center mb-8">
            <img src="/uploads/hero/logo.png" alt="Logo" className="mx-auto mb-4" style={{ height: '110px', width: 'auto', mixBlendMode: 'multiply' }} />
            <h1 className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
              {authMode === "login" ? "Welcome Back" : authMode === "signup" ? "Create an Account" : "Reset Password"}
            </h1>
          </div>

          <div className="checkout-card p-6 bg-[#f3ede6] rounded-2xl shadow-sm border border-[#e6ded4]">
            <form onSubmit={handleAuthAction} className="flex flex-col gap-4">
              <label className="checkout-field">
                <span>Email Address</span>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => {
                    setAuthEmail(e.target.value);
                    setErrorMsg("");
                  }}
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
                      onChange={(e) => {
                        setAuthPassword(e.target.value);
                        setErrorMsg("");
                      }}
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
                    onChange={(e) => {
                      setAuthConfirmPassword(e.target.value);
                      setErrorMsg("");
                    }}
                    placeholder="••••••••"
                    className="w-full border p-2 rounded"
                    required
                  />
                </label>
              )}

              {errorMsg && (
                <div style={{ color: "#dc2626", fontSize: "13px", marginTop: "4px", textAlign: "center", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} className="animate-in fade-in slide-in-from-top-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ color: "#059669", fontSize: "14px", marginTop: "16px", textAlign: "center", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }} className="animate-in fade-in slide-in-from-top-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  {successMsg}
                </div>
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
