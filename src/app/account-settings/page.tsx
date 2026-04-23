"use client";

import { supabase } from "@/lib/supabaseClient";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import { useAuth } from "@/hooks/useAuth";

export default function AccountSettingsPage() {
    const router = useRouter();
  const { session, user, loading } = useAuth();
  
  const [hydrated, setHydrated] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail === user?.email) {
      showToast("This is already your current email.");
      return;
    }
    
    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      
      if (user?.id) {
        const { error: profileError } = await supabase.from('profiles').update({ email: newEmail }).eq('id', user.id);
        if (profileError) console.error("Could not sync email to profile table:", profileError.message);
      }

      localStorage.setItem('emailChangePending', 'true');
      setModalContent({ title: "Confirm Email Identity", message: "Please check your current and new email inboxes to seamlessly confirm the update securely." });
      setNewEmail("");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Could not update email.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast("Please fill out all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setModalContent({ title: "Password Updated", message: "Your password has been successfully updated securely." });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Could not update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (!hydrated || loading) {
    return <main className="checkout-page py-20 text-center text-stone-500" />;
  }

  if (!user) return null;

  return (
    <main className="checkout-page checkout-container pb-20 pt-16 profile-page-styles">
      <style dangerouslySetInnerHTML={{__html: `
        .profile-page-styles input {
          border: 1px solid rgba(139, 94, 60, 0.4) !important;
        }
        .profile-page-styles input:focus {
          border-color: var(--brand) !important;
          outline: none;
        }
        .back-icon-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F5EFE6;
          border: 1px solid #E6DCCF;
          border-radius: 50%;
          color: #5A3E2B;
          transition: all 0.2s ease;
        }
        .back-icon-btn:hover {
          background: #E6DCCF;
          transform: translateX(-2px);
        }
      `}} />

      <div className="mx-auto w-full max-w-md px-4">
        
        <div className="flex items-center mt-8 mb-20 gap-5 pb-8 border-b border-stone-100">
          <button 
            onClick={() => router.push('/profile')} 
            className="back-icon-btn"
            aria-label="Go Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <h1 className="text-3xl font-bold m-0" style={{ color: "var(--brand)", letterSpacing: '-0.5px' }}>
            Account Settings
          </h1>
        </div>

        <div className="flex flex-col gap-10">
          {/* Email Update Card */}
          <section className="checkout-card p-6 shadow-sm">
            <div className="border-b pb-3 mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Email Authentication</h2>
              <p className="text-stone-500 text-sm mt-1">Update your primary login address.</p>
            </div>
            
            <form onSubmit={handleUpdateEmail} className="flex flex-col gap-4">
              <label className="checkout-field">
                <span>Current Email</span>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  readOnly
                  style={{ opacity: 0.6, cursor: 'not-allowed', background: 'transparent' }}
                />
              </label>

              <label className="checkout-field">
                <span>New Email Address</span>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </label>

              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className="btn-primary py-2 px-6 rounded-lg text-sm md:text-base font-medium shadow-sm transition-transform active:scale-95" 
                  disabled={isUpdatingEmail}
                >
                  {isUpdatingEmail ? "Processing..." : "Update Email"}
                </button>
              </div>
            </form>
          </section>

          {/* Password Update Card */}
          <section className="checkout-card p-6 shadow-sm">
            <div className="border-b pb-3 mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Security & Password</h2>
              <p className="text-stone-500 text-sm mt-1">Ensure your account remains securely locked.</p>
            </div>

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
              <label className="checkout-field" style={{ position: 'relative' }}>
                <span>New Password</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                      border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text)', opacity: 0.6
                    }}
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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    style={{
                      position: 'absolute', right: '12px', background: 'transparent',
                      border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text)', opacity: 0.6
                    }}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </label>

              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className="btn-primary py-2 px-6 rounded-lg text-sm md:text-base font-medium shadow-sm transition-transform active:scale-95" 
                  disabled={isUpdatingPassword}
                  style={{ background: 'var(--text)', borderColor: 'var(--text)' }}
                >
                  {isUpdatingPassword ? "Processing..." : "Update Password"}
                </button>
              </div>
            </form>
          </section>

        </div>
      </div>

      {modalContent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', backdropFilter: 'blur(4px)', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)',
            borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%',
            boxShadow: '0 10px 30px rgba(107, 66, 38, 0.15)', textAlign: 'center'
          }}>
            <h3 style={{ color: 'var(--brand)', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>{modalContent.title}</h3>
            <p style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '24px' }}>{modalContent.message}</p>
            <button onClick={() => setModalContent(null)} className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px' }}>Okay</button>
          </div>
        </div>
      )}

    </main>
  );
}
