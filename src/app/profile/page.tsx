"use client";

import { supabase } from "@/lib/supabaseClient";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { showToast } from "@/components/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { CheckoutCustomerDetails } from "@/lib/checkout";
import { useAuth } from "@/hooks/useAuth";
import { syncLocalCartToDB } from "@/lib/cartSupabase";
import { isAdmin } from "@/lib/isAdmin";
import GlobalLoader from "@/components/ui/GlobalLoader";

const initialDetails: CheckoutCustomerDetails = {
  fullName: "",
  email: "",
  phoneNumber: "",
  address: "",
  city: "",
  pincode: "",
  state: "",
  country: "",
};

export default function ProfilePage() {
    const router = useRouter();
  const searchParams = useSearchParams();
  const { session, user, profile, loading, refreshProfile } = useAuth();
  
  // Profile Form State
  const [details, setDetails] = useState<CheckoutCustomerDetails>(initialDetails);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; message: string } | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
      router.push("/auth");
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

      if (data && !isEditing) {
        setDetails({
          fullName: data.name || "",
          email: user.email || "",
          phoneNumber: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          pincode: data.pincode || "",
          state: data.state || "",
          country: data.country || "",
        });
      } else if (!data) {
        // Fallback for missing profile
        setDetails(prev => ({ ...prev, email: user.email || "" }));
      }
    };

    loadProfile();
  }, [user, isEditing]);

  // Sync details when 'profile' from useAuth changes (optional but good for consistency)
  useEffect(() => {
    if (profile && user && !isEditing) {
      setDetails({
        fullName: profile.name || "",
        email: user.email || "",
        phoneNumber: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        pincode: profile.pincode || "",
        state: profile.state || "",
        country: profile.country || "",
      });
    }
  }, [profile, user, isEditing]);

  const handleFieldChange = (field: keyof CheckoutCustomerDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const saveDetails = async () => {
    // 1. Validation
    if (!details.fullName || !details.phoneNumber) {
      showToast("Please fill all the details from the profile to continue");
      return;
    }
    
    const phoneRegex = /^[+]?[0-9\s\-]{10,15}$/;
    if (!phoneRegex.test(details.phoneNumber) || details.phoneNumber.replace(/[^0-9]/g,"").length < 10) {
      showToast("Please enter a valid phone number (10+ digits).");
      return;
    }

    if (details.pincode) {
      const pinRegex = /^[0-9]{5,6}$/;
      if (!pinRegex.test(details.pincode)) {
        showToast("Please enter a valid 6-digit pincode.");
        return;
      }
    }

    if (!user) {
      showToast("User session not found. Please log in again.");
      return;
    }

    setIsSaving(true);
    
    try {
      console.log("Saving profile for user:", user.id);
      
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        name: details.fullName,
        phone: details.phoneNumber,
        address: details.address,
        city: details.city,
        pincode: details.pincode,
        state: details.state,
        country: details.country,
      }, { onConflict: 'id' });

      if (profileError) {
        throw profileError;
      }
      
      console.log("Profile saved successfully");
      showToast("Profile updated successfully");
      
      setIsEditing(false);
      setIsSaving(false);
      setModalContent({ 
        title: "Profile Saved", 
        message: "Your profile details have been successfully updated." 
      });
      
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err: any) {
      console.error("Save Profile Error:", err);
      showToast(err.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const executeLogout = async () => {
    setShowLogoutConfirm(false);

    try {
      // 1. Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 2. Clear local data
      localStorage.clear();
      sessionStorage.clear();
      showToast("Logged out successfully");

      // 3. Force UI Reset
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
      // Fail-safe redirect
      window.location.href = "/";
    }
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
        
        showToast("Logged in successfully! Welcome back.");
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
  if (loading || !hydrated) {
    return <GlobalLoader message="Loading your profile..." />;
  }

  if (!user && !loading) return null; // Let the redirect effect handle it

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
      <div className="checkout-header flex flex-col items-center justify-center gap-4" style={{ marginTop: '40px' }}>
        <h1 className="checkout-title m-0 text-3xl md:text-5xl text-center" style={{ lineHeight: '1.2' }}>Your Profile</h1>
      </div>

      <section className="checkout-card mx-3 md:mx-auto max-w-xl w-auto md:w-full bg-[#f3ede6] rounded-2xl shadow-sm border border-[#e6ded4]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4 px-2">
          <h2 className="text-xl font-bold" style={{ color: "var(--text)", margin: 0 }}>Personal Information</h2>
          <div className="flex gap-3 items-center flex-wrap">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="btn-edit text-sm">
                Edit
              </button>
            ) : (
              <button 
                onClick={saveDetails} 
                disabled={isSaving}
                className="btn-edit text-sm" 
                style={{ background: isSaving ? "#c9b99a" : "var(--brand)", color: "white", pointerEvents: isSaving ? 'none' : 'auto' }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            )}
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
              style={{ background: "#5a3e2b", color: "white", border: "none" }}
            >
              Log Out
            </button>
          </div>
        </div>

        <div className="checkout-form-grid" style={{ opacity: isEditing ? 1 : 0.8 }} onClick={(e) => { if (!isEditing) { e.preventDefault(); showToast("Click Edit to update your details"); } }}>
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

          <label className="checkout-field">
            <span>State</span>
            <input
              type="text"
              value={details.state}
              onChange={(e) => handleFieldChange("state", e.target.value)}
              placeholder="State"
              readOnly={!isEditing}
            />
          </label>

          <label className="checkout-field">
            <span>Country</span>
            <input
              type="text"
              value={details.country}
              onChange={(e) => handleFieldChange("country", e.target.value)}
              placeholder="Country"
              readOnly={!isEditing}
            />
          </label>
        </div>
      </section>

      {/* Action Buttons */}
      {/* Action Buttons */}
      <section className="mx-auto flex flex-wrap justify-center gap-4 mt-8 px-4 md:px-0" style={{ maxWidth: '900px' }}>
        <button 
          onClick={() => router.push("/orders")} 
          className="btn-primary py-3 px-8 shadow-sm rounded-lg font-medium transition-transform active:scale-95"
          style={{ width: 'auto', minWidth: '220px', flex: '1 1 auto', maxWidth: '300px' }}
        >
          View Your Orders
        </button>

        <button 
          onClick={() => router.push("/my-reviews")} 
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

        {isAdmin(user) && (
          <button 
            onClick={() => router.push('/admin')} 
            className="btn-primary py-3 px-8 shadow-sm rounded-lg font-medium transition-transform active:scale-95"
            style={{ width: 'auto', minWidth: '220px', flex: '1 1 auto', maxWidth: '300px', background: 'var(--brand)', color: 'white' }}
          >
            Admin Dashboard
          </button>
        )}
      </section>
      {profileModalHTML}

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Log Out"
        cancelLabel="Stay Logged In"
        destructive
        onConfirm={executeLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

    </main>

  );
}
