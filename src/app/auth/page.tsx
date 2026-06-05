"use client";

import { useRouter } from "next/navigation";

export default function AuthChoicePage() {
  const router = useRouter();

  return (
    <main className="checkout-page checkout-container pb-20 pt-[20px]" style={{ paddingTop: '20px', minHeight: '100vh' }}>
      <div className="px-5 mx-auto w-full mt-4" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-8">
          <video
            autoPlay
            muted
            playsInline
            className="mx-auto mb-2"
            style={{ height: '140px', width: 'auto', objectFit: 'contain' }}
          >
            <source src="/nav-icons/logo-animation.mp4" type="video/mp4" />
          </video>
          <h1 className="text-2xl font-bold font-serif" style={{ color: "var(--brand)" }}>
            Welcome
          </h1>
          <p className="text-stone-500 mt-2 text-sm leading-relaxed">
            Sign in or create an account to track your orders and manage your wishlist.
          </p>
        </div>

        <div className="w-full mx-auto flex flex-col gap-4">
          <button 
            onClick={() => router.push("/login")} 
            className="btn-primary w-full py-3 text-sm font-semibold rounded-xl shadow-sm active:scale-[0.98] transition-transform"
          >
            Login
          </button>
          
          <button 
            onClick={() => router.push("/signup")} 
            className="btn-outline w-full text-sm font-semibold shadow-sm"
          >
            Create Account
          </button>

          <div className="mt-4 text-center">
            <button 
              onClick={() => router.push("/")} 
              className="inline-block text-sm font-semibold hover:opacity-80 transition-opacity"
              style={{ color: "var(--brand)", background: "none", border: "none", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", margin: "0 auto" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Return to Store
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
