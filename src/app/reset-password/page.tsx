"use client";

import { supabase } from "@/lib/supabaseClient";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

export default function ResetPasswordPage() {
    const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const handleRecovery = async () => {
      // Supabase automatically logs user in temporarily after clicking reset link
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setLoading(false);
      } else {
        console.warn("No recovery session found, redirecting to login.");
        router.push("/login");
      }
    };

    handleRecovery();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      showToast("Password must be at least 6 characters.");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      showToast("Security updated. Please login with your new password.");

      // IMPORTANT: Sign out to clear the temporary session
      await supabase.auth.signOut();
      
      router.push("/login");
    } catch (err: any) {
      showToast(err.message || "Error updating password.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-stone-500 font-medium">Verifying reset link...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page checkout-container pb-20 pt-[120px]">
      <div className="mx-auto w-full" style={{ maxWidth: "380px", marginTop: "40px" }}>
        <div className="text-center mb-8">
          <img
            src="/uploads/hero/logo.png"
            alt="Logo"
            className="mx-auto mb-4"
            style={{ height: "110px", width: "auto", mixBlendMode: "multiply" }}
          />
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand)" }}>
            Create New Password
          </h1>
          <p className="text-stone-500 text-sm mt-2">
            Enter a secure password to regain access to your account.
          </p>
        </div>

        <div className="checkout-card p-6 shadow-sm">
          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
            <label className="checkout-field">
              <span>New Password</span>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border p-2 rounded"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "10px", top: "10px", opacity: 0.6 }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button
              type="submit"
              className="btn-primary w-full py-3 mt-2"
              disabled={updating}
            >
              {updating ? "Updating..." : "Update Password"}
            </button>
          </form>

          <div className="mt-8 text-center sm">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-bold text-[var(--brand)] underline"
            >
              Cancel and go to Login
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
