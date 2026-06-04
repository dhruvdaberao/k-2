"use client";

import { supabase } from "@/lib/supabaseClient";
import { logoutAction } from "@/actions/auth";import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

function ProfileContent() {
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

  const addressRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (addressRef.current) {
      addressRef.current.style.height = "auto";
      addressRef.current.style.height = addressRef.current.scrollHeight + "px";
    }
  }, [details.address]);

  useEffect(() => {
    setHydrated(true);
    if (searchParams.get("edit") === "true") {
      setIsEditing(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (hydrated && typeof window !== "undefined") {
      const prompt = localStorage.getItem('promptSetPassword');
      if (prompt === 'true') {
        setModalContent({
          title: "Account Auto-Created!",
          message: "We automatically saved your details from your guest checkout! For easier access in the future, please go to 'Account Settings' below to set up your own password. If you skip this, you can always log in via OTP."
        });
        localStorage.removeItem('promptSetPassword');
      }
    }
  }, [hydrated]);

  // Step 7: Protected Route Redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Always ensure profile is up to date when entering the profile page
  useEffect(() => {
    if (user && !loading && refreshProfile) {
      refreshProfile();
    }
  }, [user, loading]); // run when user/loading state resolves

  // Sync details when 'profile' from useAuth changes
  // Falls back to locally saved checkout details if profile fields are empty
  useEffect(() => {
    if (user && !isEditing) {
      // Start with what we have from Supabase profile
      const fromProfile: CheckoutCustomerDetails = {
        fullName: profile?.name || "",
        email: user.email || "",
        phoneNumber: profile?.phone || "",
        address: profile?.address || "",
        city: profile?.city || "",
        pincode: profile?.pincode || "",
        state: profile?.state || "",
        country: profile?.country || "",
      };

      // If key fields are empty, try to fill from localStorage checkout details
      const hasEmpty = !fromProfile.fullName || !fromProfile.phoneNumber || !fromProfile.address;
      if (hasEmpty) {
        try {
          const stored = localStorage.getItem("checkout:details:v1") || localStorage.getItem("customer_details");
          if (stored) {
            const parsed = JSON.parse(stored);
            // customer_details uses different key names
            const localName = parsed.fullName || parsed.name || "";
            const localPhone = parsed.phoneNumber || parsed.phone || "";
            const localAddress = parsed.address || "";
            const localCity = parsed.city || "";
            const localPincode = parsed.pincode || "";
            const localState = parsed.state || "";
            const localCountry = parsed.country || "";

            fromProfile.fullName = fromProfile.fullName || localName;
            fromProfile.phoneNumber = fromProfile.phoneNumber || localPhone;
            fromProfile.address = fromProfile.address || localAddress;
            fromProfile.city = fromProfile.city || localCity;
            fromProfile.pincode = fromProfile.pincode || localPincode;
            fromProfile.state = fromProfile.state || localState;
            fromProfile.country = fromProfile.country || localCountry;
          }
        } catch {}
      }

      setDetails(fromProfile);
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
    
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(details.phoneNumber)) {
      showToast("Invalid Phone Number. It must be exactly 10 digits.");
      return;
    }

    if (details.pincode) {
      const pinRegex = /^\d{6}$/;
      if (!pinRegex.test(details.pincode)) {
        showToast("Invalid Pincode. It must be exactly 6 digits.");
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
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("No active session token");

      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: details.fullName,
          phone: details.phoneNumber,
          address: details.address,
          city: details.city,
          pincode: details.pincode,
          state: details.state,
          country: details.country,
        })
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Failed to update profile");
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

    // Show instant visual feedback so user knows something is happening
    showToast("Logging out...");

    try {
      // 1. Sign out from Server Action (with timeout so it never hangs)
      const signOutPromise = logoutAction();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000)
      );
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (err) {
      // Even if signOut fails or times out, we still log out locally
      console.warn("Logout signOut error (proceeding anyway):", err);
    }

    // 2. Aggressively clear ALL local data
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}

    showToast("Logged out successfully!");

    // 3. Hard redirect — never use router.push for logout as it can silently fail
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
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
          redirectTo: `${window.location.origin}/reset-password`
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

  // Step 3-4: Loading Guards — show inline skeleton instead of full-screen loader
  if (loading || !hydrated) {
    return (
      <main className="checkout-page checkout-container pb-20 profile-page-styles">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes profileShimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .profile-skeleton-bar {
            background: linear-gradient(90deg, #e8dfd4 25%, #f5efe6 37%, #e8dfd4 63%);
            background-size: 800px 100%;
            animation: profileShimmer 1.6s ease-in-out infinite;
            border-radius: 8px;
          }
        `}} />
        <header className="mb-8 text-center" style={{ marginTop: '40px' }}>
          <h1 className="collections-title mb-6">Your Profile</h1>
        </header>
        <section className="checkout-card rounded-2xl shadow-sm" style={{ maxWidth: '900px', width: '92%', margin: '0 auto', border: '1px solid rgba(139, 94, 60, 0.4)', padding: '28px 24px' }}>
          <div className="profile-skeleton-bar" style={{ width: '180px', height: '22px', marginBottom: '24px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i}>
                <div className="profile-skeleton-bar" style={{ width: '80px', height: '14px', marginBottom: '8px' }} />
                <div className="profile-skeleton-bar" style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
            <div className="profile-skeleton-bar" style={{ flex: 1, height: '48px', borderRadius: '12px' }} />
            <div className="profile-skeleton-bar" style={{ flex: 1, height: '48px', borderRadius: '12px' }} />
          </div>
        </section>
      </main>
    );
  }

  if (!user && !loading) return null; // Let the redirect effect handle it

  const profileModalHTML = modalContent && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]" style={{ backdropFilter: 'blur(4px)' }}>
      <div className="bg-[#F5EFE6] rounded-[24px] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
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
        @media (min-width: 1024px) {
          .profile-page-styles .checkout-field span {
            font-size: 16px !important;
            margin-bottom: 8px !important;
          }
          .profile-page-styles input, 
          .profile-page-styles textarea,
          .profile-page-styles .checkout-field > div {
            font-size: 18px !important;
            padding: 16px !important;
          }
          .profile-page-styles .btn-primary {
            font-size: 18px !important;
            padding: 14px 24px !important;
          }
        }
      `}} />
      <header className="mb-8 text-center" style={{ marginTop: '40px' }}>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#2f2a26]">Your Profile</h1>
      </header>

      <section className="checkout-card rounded-2xl shadow-sm mx-auto w-[92%] border border-[rgba(139,94,60,0.4)] p-6 md:p-12" style={{ maxWidth: '1000px' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12 border-b pb-4 px-2">
          <h2 className="text-xl md:text-3xl font-bold" style={{ color: "var(--text)", margin: 0 }}>Personal Information</h2>
        </div>

        <div className="checkout-form-grid" style={{ opacity: isEditing ? 1 : 0.8 }}>
          <label className="checkout-field"><span>Full Name</span><input type="text" value={details.fullName} onChange={(e) => handleFieldChange("fullName", e.target.value)} readOnly={!isEditing} /></label>
          <label className="checkout-field"><span>Email Address</span><input type="email" value={details.email} readOnly={true} style={{ opacity: 0.7 }} /></label>
          <label className="checkout-field"><span>Phone Number</span><input type="tel" value={details.phoneNumber} onChange={(e) => handleFieldChange("phoneNumber", e.target.value)} readOnly={!isEditing} /></label>
          <label className="checkout-field checkout-field--full">
            <span>Delivery Address</span>
            {!isEditing ? (
              <div style={{ width: '100%', minHeight: '48px', padding: '0.85rem 0.95rem', borderRadius: '10px', border: '1px solid rgba(139, 94, 60, 0.4)', background: '#ffffff', color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.5' }}>
                {details.address}
              </div>
            ) : (
              <textarea ref={addressRef} rows={3} value={details.address} onChange={(e) => handleFieldChange("address", e.target.value)} style={{ overflow: 'hidden', resize: 'none' }} />
            )}
          </label>
          <label className="checkout-field"><span>City</span><input type="text" value={details.city} onChange={(e) => handleFieldChange("city", e.target.value)} readOnly={!isEditing} /></label>
          <label className="checkout-field"><span>Pincode</span><input type="text" value={details.pincode} onChange={(e) => handleFieldChange("pincode", e.target.value)} readOnly={!isEditing} /></label>
          <label className="checkout-field"><span>State</span><input type="text" value={details.state} onChange={(e) => handleFieldChange("state", e.target.value)} readOnly={!isEditing} /></label>
          <label className="checkout-field"><span>Country</span><input type="text" value={details.country} onChange={(e) => handleFieldChange("country", e.target.value)} readOnly={!isEditing} /></label>
        </div>

        <div className="pt-8 md:pt-12 border-t border-[#e6ded4] w-full" style={{ marginTop: '48px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-primary" style={{ width: "100%", maxWidth: "250px", flex: '1 1 calc(50% - 12px)' }}>Edit Profile</button>
          ) : (
            <button onClick={saveDetails} disabled={isSaving} className="btn-primary" style={{ width: "100%", maxWidth: "250px", flex: '1 1 calc(50% - 12px)', background: isSaving ? "#c9b99a" : "var(--brand)" }}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          )}
          <button onClick={handleLogout} className="btn-primary" style={{ width: "100%", maxWidth: "250px", flex: '1 1 calc(50% - 12px)', background: 'transparent', color: 'var(--brand)', border: '2px solid var(--brand)' }}>Log Out</button>
        </div>
      </section>

      <section className="mx-auto mt-8 md:mt-12 px-4 md:px-0 w-full" style={{ maxWidth: '800px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px' }}>
        <Link href="/orders" prefetch={true} className="btn-primary text-center" style={{ width: "100%", maxWidth: "250px", flex: '1 1 calc(50% - 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Your Orders</Link>
        <Link href="/my-reviews" prefetch={true} className="btn-primary text-center" style={{ width: "100%", maxWidth: "250px", flex: '1 1 calc(50% - 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Your Reviews</Link>
        <Link href="/account-settings" prefetch={true} className="btn-primary text-center" style={{ width: "100%", maxWidth: "250px", flex: '1 1 calc(50% - 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--brand)', border: '2px solid var(--brand)' }}>Account Settings</Link>
        {isAdmin(user) && (<Link href="/admin" prefetch={true} className="btn-primary text-center" style={{ width: "100%", maxWidth: "250px", flex: '1 1 calc(50% - 12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand)', color: 'white' }}>Admin Portal</Link>)}
      </section>
      {profileModalHTML}
      <ConfirmModal isOpen={showLogoutConfirm} title="Confirm Logout" message="Are you sure you want to log out?" confirmLabel="Log Out" onConfirm={executeLogout} onCancel={() => setShowLogoutConfirm(false)} />
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <ProfileContent />
    </Suspense>
  );
}
