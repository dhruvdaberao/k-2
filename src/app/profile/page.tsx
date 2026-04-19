"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const { session, user, profile, loading, refreshProfile } = useAuth();
  
  // Profile Form State
  const [details, setDetails] = useState<CheckoutCustomerDetails>(initialDetails);
  const [isEditing, setIsEditing] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
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
    if (searchParams.get("edit") === "true") {
      setIsEditing(true);
    }
  }, [searchParams]);

  // Step 7: Protected Route Redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Step 4: Robust Profile Loading
  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setDetails({
          fullName: data.name || "",
          email: user.email || "",
          phoneNumber: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          pincode: data.pincode || "",
        });
      } else {
        // Fallback for missing profile
        setDetails(prev => ({ ...prev, email: user.email || "" }));
      }
    };

    loadProfile();
  }, [user]);

  // Sync details when 'profile' from useAuth changes (optional but good for consistency)
  useEffect(() => {
    if (profile && user) {
      setDetails({
        fullName: profile.name || "",
        email: user.email || "",
        phoneNumber: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        pincode: profile.pincode || "",
      });
    }
  }, [profile, user]);

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

  // Step 5: Enhanced Logout logic
  const handleLogout = async () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    showToast("You have been securely logged out.");
    setIsLogoutModalOpen(false);
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
          redirectTo: "https://keshvicrafts-2.vercel.app/reset-password"
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

  // Step 3-4: Loading Guards
  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center">
        <p className="text-stone-500 font-medium italic">Loading profile security...</p>
      </main>
    );
  }

  if (!user) return null; // Let the redirect effect handle it

  if (profile === undefined && !details.fullName && !details.phoneNumber) {
    return (
      <main className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-500">Loading your profile data...</p>
        </div>
      </main>
    );
  }

  const profileModalHTML = modalContent && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
        <h3 className="text-xl font-bold mb-2" style={{ color: "var(--brand)" }}>{modalContent.title}</h3>
        <p className="text-stone-600 mb-6 leading-relaxed">{modalContent.message}</p>
        <button 
          onClick={() => setModalContent(null)}
          className="btn-primary w-full py-3 rounded-xl shadow-lg"
        >
          Sounds Good
        </button>
      </div>
    </div>
  );

  const logoutModalHTML = isLogoutModalOpen && (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-[10000]" style={{ backdropFilter: 'blur(8px)' }}>
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-stone-100 flex flex-col items-center text-center scale-up-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
        <h3 className="text-2xl font-bold text-stone-900 mb-2">Wait, Logout?</h3>
        <p className="text-stone-500 mb-8 max-w-[260px]">Are you sure you want to sign out from your account?</p>
        
        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={confirmLogout}
            className="w-full py-4 bg-stone-900 text-white rounded-2xl font-bold hover:bg-black transition-colors"
          >
            Yes, Log Me Out
          </button>
          <button 
            onClick={() => setIsLogoutModalOpen(false)}
            className="w-full py-4 bg-white text-stone-500 rounded-2xl font-semibold hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

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
      {logoutModalHTML}
    </main>
  );
}
