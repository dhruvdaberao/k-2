"use client";

import { useRouter } from "next/navigation";

export default function AuthChoicePage() {
  const router = useRouter();

  return (
    <main className="checkout-page checkout-container pb-20 pt-[40px]" style={{ paddingTop: '40px', minHeight: '100vh' }}>
      <div className="px-4 sm:px-6 md:px-0 max-w-md mx-auto w-full mt-4">
        <div className="text-center mb-4">
          <img src="/uploads/hero/logo.png" alt="Logo" className="mx-auto mb-4" style={{ height: '110px', width: 'auto', mixBlendMode: 'multiply' }} />
          <h1 className="text-3xl font-bold" style={{ color: "var(--brand)" }}>
            Welcome
          </h1>
          <p className="text-stone-500 mt-2">To continue, please sign in or create a new account.</p>
        </div>

        <div className="max-w-sm w-full mx-auto flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500 text-center">
              Already have an account? Please login below
            </p>
            <button 
              onClick={() => router.push("/login")} 
              className="btn-primary w-full py-3 text-sm font-medium rounded-xl shadow-sm active:scale-[0.98]"
            >
              Login
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <p className="text-sm text-gray-500 text-center">
              Don’t have an account yet? Create one below
            </p>
            <button 
              onClick={() => router.push("/signup")} 
              className="btn-primary w-full py-3 text-sm font-medium rounded-xl shadow-sm active:scale-[0.98]"
            >
              Create Account
            </button>
          </div>

          <div className="mt-2 text-center">
            <button 
              onClick={() => router.push("/")} 
              className="inline-block mt-3 text-sm font-medium hover:opacity-80 transition"
              style={{ color: "var(--brand)", background: "none", border: "none", textDecoration: "underline", boxShadow: "none" }}
            >
              &larr; Back to Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
