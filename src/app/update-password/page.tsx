"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { showToast } from "@/components/Toast";
import { useAuth } from "@/hooks/useAuth";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      showToast("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      showToast("Password updated successfully! Redirecting...");
      setTimeout(() => {
        router.replace("/profile");
      }, 2000);
    } catch (err: any) {
      console.error("Update Password Error:", err);
      showToast(err.message || "Could not update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hydrated || loading) {
    return <main className="checkout-page py-20 text-center text-stone-500" />;
  }

  // If no session is present, they shouldn't technically be here, but we'll let auth flow handle it.
  // Although Supabase parses the hash fragment and establishes session just before this renders.
  if (!session) {
    return (
      <main className="checkout-page py-32 text-center">
        <h1 className="text-2xl font-bold text-[var(--brand)]">Invalid or expired link</h1>
        <p className="text-stone-500 mt-2">Please request a new password reset link.</p>
        <button onClick={() => router.replace("/profile")} className="btn-primary mt-6 px-6 py-2">
          Back to Login
        </button>
      </main>
    );
  }

  return (
    <main className="checkout-page checkout-container pb-20 pt-[120px] profile-page-styles" style={{ paddingTop: '120px' }}>
      <style dangerouslySetInnerHTML={{__html: `
        .profile-page-styles input {
          border: 1px solid rgba(139, 94, 60, 0.4) !important;
        }
        .profile-page-styles input:focus {
          border-color: var(--brand) !important;
          outline: none;
        }
      `}} />
      
      <div className="mx-auto w-full" style={{ maxWidth: '380px', marginTop: '40px' }}>
        <div className="text-center mb-8">
          <img src="/uploads/hero/logo.png" alt="Keshvi Crafts Logo" className="mx-auto mb-4" style={{ height: '110px', width: 'auto', maxWidth: '100%', mixBlendMode: 'multiply' }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
            Update Password
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Please secure your account with a new password.
          </p>
        </div>

        <div className="checkout-card p-6 shadow-sm">
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
            
            <label className="checkout-field" style={{ position: 'relative' }}>
              <span>New Password</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={{
                    position: 'absolute', right: '12px', background: 'transparent',
                    border: 'none', cursor: 'pointer', padding: 0,
                    color: 'var(--text)', opacity: 0.6
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </label>

            <label className="checkout-field" style={{ position: 'relative' }}>
              <span>Confirm New Password</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ width: '100%', paddingRight: '40px' }}
                />
              </div>
            </label>

            <button 
              type="submit" 
              className="btn-primary w-full py-3 mt-4" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>

          </form>
          
          <div className="mt-6 text-center text-sm">
             <button onClick={() => router.replace("/profile")} style={{ border: 'none', background: 'transparent', padding: 0 }} className="font-bold text-[var(--brand)] hover:underline">Cancel & Return</button>
          </div>
        </div>
      </div>
    </main>
  );
}
