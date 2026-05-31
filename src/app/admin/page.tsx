"use client";

import { isAdmin } from "@/lib/isAdmin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // 1. Unified Auth Check
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
          console.warn("Auth check error (bypassing strict redirect):", authError);
        } else if (!authData?.session?.user || authData.session.user.email !== "keshvicrafts@gmail.com") {
          router.push("/");
          return;
        }
      } catch (err) {
        console.error("Admin Auth Error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    // Safety: never show loading for more than 2 seconds if auth API hangs
    const safety = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(safety);
    };
  }, []);


  return (
    <main className="min-h-screen bg-[#FDFBF7] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 md:mb-12 relative flex flex-col items-center md:items-start" style={{ paddingTop: '40px', paddingBottom: '20px' }}>
          <Link
            href="/profile"
            className="absolute left-0 p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors flex items-center justify-center"
            style={{ textDecoration: "none", top: '40px', left: '-8px' }}
            title="Back to Profile"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <div className="text-center md:text-left px-10 md:px-14">
            <h1 className="text-3xl md:text-5xl font-bold text-[#4A3219] mb-2 leading-tight" style={{ letterSpacing: "-0.3px" }}>
              Admin <br /> Dashboard
            </h1>
            <p className="text-stone-500 text-sm md:text-lg mt-2">
              Manage orders and platform activity
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ backgroundColor: '#F5EFE6', border: '1px solid rgba(139, 94, 60, 0.4)', padding: '32px' }}>
            <div className="mb-6 opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#3E2C1C] mb-2">Products</h2>
            <p className="text-[#8B7355] text-sm mb-6">Add, edit, and manage your product catalog.</p>
            <div className="mt-auto">
              <Link href="/admin/products" className="btn-primary block w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm shadow-sm transition-transform active:scale-95" style={{ background: "var(--brand)", color: "white", textDecoration: "none" }}>
                Manage Products
              </Link>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ backgroundColor: '#F5EFE6', border: '1px solid rgba(139, 94, 60, 0.4)', padding: '32px' }}>
            <div className="mb-6 opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#3E2C1C] mb-2">Orders</h2>
            <p className="text-[#8B7355] text-sm mb-6">View, manage, and update customer order statuses.</p>
            <div className="mt-auto">
              <Link href="/admin/orders" className="btn-primary block w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm shadow-sm transition-transform active:scale-95" style={{ background: "var(--brand)", color: "white", textDecoration: "none" }}>
                Manage Orders
              </Link>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ backgroundColor: '#F5EFE6', border: '1px solid rgba(139, 94, 60, 0.4)', padding: '32px' }}>
            <div className="mb-6 opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#3E2C1C] mb-2">Reviews</h2>
            <p className="text-[#8B7355] text-sm mb-6">Moderate and manage customer product reviews.</p>
            <div className="mt-auto">
              <Link href="/admin/reviews" className="btn-primary block w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm shadow-sm transition-transform active:scale-95" style={{ background: "var(--brand)", color: "white", textDecoration: "none" }}>
                Manage Reviews
              </Link>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ backgroundColor: '#F5EFE6', border: '1px solid rgba(139, 94, 60, 0.4)', padding: '32px' }}>
            <div className="mb-6 opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#5A3E2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#3E2C1C] mb-2">Carousels</h2>
            <p className="text-[#8B7355] text-sm mb-6">Manage homepage hero slides and timer.</p>
            <div className="mt-auto">
              <Link href="/admin/carousels" className="btn-primary block w-full text-center py-2.5 px-4 rounded-xl font-semibold text-sm shadow-sm transition-transform active:scale-95" style={{ background: "var(--brand)", color: "white", textDecoration: "none" }}>
                Manage Carousels
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
