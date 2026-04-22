"use client";

import { supabase } from "@/lib/supabaseClient";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
    const router = useRouter();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    let mounted = true;

    const executeCallbackRoutines = async () => {
      // Fetch latest session constraints inherently from Supabase redirect
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.id && user?.email) {
        // Deep Sync Postgres Profile Fallback seamlessly per constraint "Sync profiles email with auth email"
        await supabase.from("profiles").update({ email: user.email }).eq("id", user.id);
      }

      const isEmailPending = localStorage.getItem("emailChangePending");
      
      if (!mounted) return;

      if (isEmailPending) {
        setMessage("Old email confirmed (Step 1 of 2). Check your new email.");
        localStorage.removeItem("emailChangePending");
      } else {
        setMessage("Email updated successfully");
      }
    };

    executeCallbackRoutines();
    
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="checkout-page checkout-container pb-20 pt-[120px]" style={{ paddingTop: '120px', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        backgroundColor: 'var(--bg-main)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%',
        boxShadow: '0 10px 30px rgba(107, 66, 38, 0.15)', textAlign: 'center'
      }}>
        <h3 style={{ color: 'var(--brand)', textTransform: 'uppercase', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          Verification
        </h3>
        
        <p style={{ color: 'var(--text)', fontSize: '18px', marginBottom: '32px', fontWeight: '500' }}>
          {message}
        </p>
        
        {message !== "Verifying..." && (
          <button 
            onClick={() => router.push('/profile')} 
            className="btn-primary flex items-center justify-center font-bold" 
            style={{ width: '100%', padding: '14px', borderRadius: '8px' }}
          >
            Go to Profile
          </button>
        )}
      </div>
    </main>
  );
}
