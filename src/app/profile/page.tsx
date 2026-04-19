"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import type { CheckoutCustomerDetails } from "@/lib/checkout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import { syncLocalCartToDB } from "@/lib/cartSupabase";

const initialDetails: CheckoutCustomerDetails = {
  fullName: "",
  email: "",
  phoneNumber: "",
  address: "",
  city: "",
  pincode: "",
};

export default function ProfilePage() {
  const router = useRouter();
  const { session, user, profile, loading, refreshProfile } = useAuth();
  
  // Profile Form State
  const [details, setDetails] = useState<CheckoutCustomerDetails>(initialDetails);
  const [isEditing, setIsEditing] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Auth View State
  const [authMode, setAuthMode] = useState<"login" | "signup" | "forgot">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (profile && user) {
      if (user.email && profile.email !== user.email) {
        supabase.from('profiles').update({ email: user.email }).eq('id', user.id).then(() => refreshProfile());
      }
      setDetails({
        fullName: profile.name || "",
        email: user.email || "",
        phoneNumber: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        pincode: profile.pincode || "",
      });
    } else if (user && !profile && !authLoading) {
      supabase.from('profiles').insert([{ id: user.id, email: user.email }]).then(() => refreshProfile());
      setDetails((prev) => ({ ...prev, email: user.email || "" }));
    } else if (!user) {
      setDetails(initialDetails);
    }
  }, [profile, user, authLoading]);

  const handleFieldChange = (field: keyof CheckoutCustomerDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const saveDetails = async () => {
    if (!details.fullName || !details.email || !details.phoneNumber) {
      showToast("Name, Email, and Phone are required.");
      return;
    }
    
    // RegEx Validation Overrides
    const phoneRegex = /^[+]?[0-9\s\-]{10,15}$/;
    if (!phoneRegex.test(details.phoneNumber)) {
      showToast("Please enter a valid phone number.");
      return;
    }

    if (details.pincode) {
      const pinRegex = /^[0-9]{5,6}$/;
      if (!pinRegex.test(details.pincode)) {
        showToast("Please enter a valid pincode.");
        return;
      }
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (details.email !== user.email && isEditing) {
      showToast("Email updates are locked to Account Settings.");
    }

    const { data: updateData, error: profileError } = await supabase.from('profiles').update({
      name: details.fullName,
      phone: details.phoneNumber,
      address: details.address,
      city: details.city,
      pincode: details.pincode,
    }).eq('id', user.id).select();

    if (profileError) {
      console.error("Update Error:", profileError);
      showToast(profileError.message || "Failed to save profile.");
      return;
    }
    
    // Explicit Fallback Loop per user checklist: "If update returns 0 rows: Insert instead (fallback)"
    if (updateData && updateData.length === 0) {
      console.warn("Update returned 0 rows. Attempting fallback insertion.");
      const { error: insertFallbackError } = await supabase.from('profiles').insert([{
        id: user.id,
        email: user.email,
        name: details.fullName,
        phone: details.phoneNumber,
        address: details.address,
        city: details.city,
        pincode: details.pincode,
      }]);
      if (insertFallbackError) {
        console.error("Fallback Insertion Error:", insertFallbackError);
        showToast(insertFallbackError.message || "Failed to create missing profile.");
        return;
      }
      console.log("Fallback Insertion Success.");
    } else {
      console.log("Update Success:", updateData);
    }
    
    setIsEditing(false);
    setModalContent({ title: "Profile Saved", message: "Your profile has been successfully updated." });
    await refreshProfile();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    showToast("You have been securely logged out.");
  };

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
        
        // Supabase returns a fake success if email confirmations are enabled but the user already exists.
        // If identities is empty, the email is already registered.
        if (data?.user?.identities && data.user.identities.length === 0) {
          throw new Error("This email address is already registered. Please login.");
        }
        
        console.log("Supabase Auth Response:", data);

        if (data?.user?.id) {
          if (!data.session) {
            setModalContent({ title: "Account Created", message: "Verification email sent. Please check your inbox to activate your account." });
            setAuthMode("login");
          } else {
            await syncLocalCartToDB(data.user.id);
            showToast("Account created successfully. Welcome to Keshvi Crafts!");
          }
        }
      } else if (authMode === "login") {
        if (!authPassword) throw new Error("Please enter a password");
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        console.log("Supabase Auth Success:", data);
        
        if (data.user?.id) {
          await syncLocalCartToDB(data.user.id);
        }
        
        setModalContent({ title: "Login Successful", message: "Successfully logged in! Welcome back." });
      } else if (authMode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
          redirectTo: `${window.location.origin}/update-password`
        });
        if (error) throw error;
        setModalContent({ title: "Email Sent", message: "Check your email for the password reset link." });
        setAuthMode("login");
      }
    } catch (err: any) {
      console.error("Auth Full Error Object:", err);
      const msg = err.message || "";
      if (msg.toLowerCase().includes("rate limit")) {
        showToast("Too many requests, please wait a few minutes.");
      } else {
        showToast(msg || "An unexpected error occurred.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (!hydrated || authLoading || loading) {
    return <main className="checkout-page py-20 text-center text-stone-500" />;
  }

  const profileModalHTML = modalContent && (
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
  );

  // --- UNAUTHENTICATED UI ---
  if (!session) {
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
                />
              </label>

              {authMode !== "forgot" && (
                <>
                  <label className="checkout-field" style={{ position: 'relative' }}>
                    <span>Password</span>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        style={{ width: '100%', paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: 'var(--text)',
                          opacity: 0.6
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

                  {authMode === "signup" && (
                    <label className="checkout-field" style={{ position: 'relative' }}>
                      <span>Confirm Password</span>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={authConfirmPassword}
                          onChange={(e) => setAuthConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          style={{ width: '100%', paddingRight: '40px' }}
                        />
                      </div>
                    </label>
                  )}
                </>
              )}

              <button 
                type="submit" 
                className="btn-primary w-full py-3 mt-2" 
                disabled={authLoading}
              >
                {authLoading ? "Processing..." : authMode === "login" ? "Login" : authMode === "signup" ? "Create Account" : "Send Reset Link"}
              </button>

              {authMode === "signup" && (
                <p className="text-xs text-stone-500 text-center -mt-2">
                  You will receive a verification email after signup.
                </p>
              )}

            </form>

            <div className="mt-8 flex flex-col items-center gap-3 text-sm">
              {authMode === "login" ? (
                <>
                  <button type="button" onClick={() => setAuthMode("forgot")} style={{ border: 'none', background: 'transparent', padding: 0 }} className="text-stone-500 hover:text-stone-800 underline">Forgot Password?</button>
                  <p className="text-stone-500">Don't have an account? <button type="button" onClick={() => setAuthMode("signup")} style={{ border: 'none', background: 'transparent', padding: 0 }} className="font-bold text-[var(--brand)] hover:underline">Sign Up</button></p>
                </>
              ) : authMode === "signup" ? (
                <p className="text-stone-500">Already have an account? <button type="button" onClick={() => setAuthMode("login")} style={{ border: 'none', background: 'transparent', padding: 0 }} className="font-bold text-[var(--brand)] hover:underline">Login</button></p>
              ) : (
                <button type="button" onClick={() => setAuthMode("login")} style={{ border: 'none', background: 'transparent', padding: 0 }} className="font-bold text-[var(--brand)] hover:underline">Back to Login</button>
              )}
            </div>
          </div>
        </div>

        {profileModalHTML}
      </main>
    );
  }

  // --- AUTHENTICATED UI ---
  return (
    <main className="checkout-page checkout-container pb-20 profile-page-styles">
      <style dangerouslySetInnerHTML={{__html: `
        .profile-page-styles input, 
        .profile-page-styles textarea {
          border: 1px solid rgba(139, 94, 60, 0.4) !important;
        }
        .profile-page-styles input:focus, 
        .profile-page-styles textarea:focus {
          border-color: var(--brand) !important;
          outline: none;
        }
        .profile-page-styles .btn-edit {
          border: 1px solid var(--brand);
          color: var(--brand);
          background: transparent;
          border-radius: 8px;
          padding: 6px 16px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        .profile-page-styles .btn-edit:hover {
          background: var(--brand);
          color: white;
        }
      `}} />
      <div className="checkout-header flex flex-col items-center justify-center gap-4" style={{ marginTop: '100px', paddingTop: '40px' }}>
        <div className="flex items-center gap-6">
          <h1 className="checkout-title m-0 text-3xl md:text-5xl" style={{ lineHeight: '1' }}>Your Profile</h1>
          <button 
            onClick={handleLogout} 
            className="btn-primary px-6 py-2 shadow-sm rounded-lg"
            style={{ width: 'auto', margin: 0, fontSize: '15px' }}
          >
            Log Out
          </button>
        </div>
      </div>

      <section className="checkout-card mx-auto max-w-xl w-full">
        <div className="flex justify-between items-center mb-6 border-b pb-4 px-2">
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Personal Information</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-edit text-sm">
              Edit
            </button>
          ) : (
            <button onClick={saveDetails} className="btn-edit text-sm" style={{ background: "var(--brand)", color: "white" }}>
              Save Changes
            </button>
          )}
        </div>

        <div className="checkout-form-grid" style={{ pointerEvents: isEditing ? 'auto' : 'none', opacity: isEditing ? 1 : 0.8 }}>
          <label className="checkout-field">
            <span>Full Name</span>
            <input
              type="text"
              value={details.fullName}
              onChange={(e) => handleFieldChange("fullName", e.target.value)}
              placeholder="Your Name"
              readOnly={!isEditing}
            />
          </label>

          <label className="checkout-field" onClick={() => { if(isEditing) showToast("Mail can only be edited from Account Settings.") }}>
            <span>Email Address</span>
            <input
              type="email"
              value={details.email}
              readOnly={true}
              style={{ cursor: isEditing ? 'not-allowed' : 'default', opacity: 0.7 }}
            />
          </label>

          <label className="checkout-field">
            <span>Phone Number</span>
            <input
              type="tel"
              value={details.phoneNumber}
              onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
              placeholder="+91 1234567890"
              readOnly={!isEditing}
            />
          </label>
          
          {/* Spacer */}
          <div className="hidden md:block"></div>

          <label className="checkout-field checkout-field--full">
            <span>Delivery Address</span>
            <textarea
              rows={3}
              value={details.address}
              onChange={(e) => handleFieldChange("address", e.target.value)}
              placeholder="House, street, landmark"
              readOnly={!isEditing}
            />
          </label>

          <label className="checkout-field">
            <span>City</span>
            <input
              type="text"
              value={details.city}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              placeholder="Bikini Bottom"
              readOnly={!isEditing}
            />
          </label>

          <label className="checkout-field">
            <span>Pincode</span>
            <input
              type="text"
              inputMode="numeric"
              value={details.pincode}
              onChange={(e) => handleFieldChange("pincode", e.target.value)}
              placeholder="123456"
              readOnly={!isEditing}
            />
          </label>
        </div>
      </section>

      {/* Action Buttons */}
      {/* Action Buttons */}
      <section className="mx-auto flex flex-wrap justify-center gap-4 mt-8 px-4 md:px-0" style={{ maxWidth: '900px' }}>
        <button 
          onClick={() => showToast("Order history will be available soon.")} 
          className="btn-primary py-3 px-8 shadow-sm rounded-lg font-medium transition-transform active:scale-95"
          style={{ width: 'auto', minWidth: '220px', flex: '1 1 auto', maxWidth: '300px' }}
        >
          View Your Orders
        </button>

        <button 
          onClick={() => showToast("Review system will be available soon.")} 
          className="btn-primary py-3 px-8 shadow-sm rounded-lg font-medium transition-transform active:scale-95"
          style={{ width: 'auto', minWidth: '220px', flex: '1 1 auto', maxWidth: '300px' }}
        >
          Your Reviews
        </button>
        
        <button 
          onClick={() => router.push('/account-settings')} 
          className="btn-primary py-3 px-8 shadow-sm rounded-lg font-medium transition-transform active:scale-95"
          style={{ width: 'auto', minWidth: '220px', flex: '1 1 auto', maxWidth: '300px', background: 'var(--bg-main)', color: 'var(--brand)', border: '1px solid var(--brand)' }}
        >
          Account Settings
        </button>
      </section>
      {profileModalHTML}
    </main>
  );
}
