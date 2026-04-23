"use client";

import { isAdmin } from "@/lib/isAdmin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import GlobalLoader from "@/components/ui/GlobalLoader";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // 1. Unified Auth Check
  useEffect(() => {
    const init = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user || authData.user.email !== "keshvicrafts@gmail.com") {
          router.push("/");
          return;
        }
      } catch (err) {
        console.error("Admin Auth Error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Fail-safe timeout
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, [router]);

  if (loading) {
    return <GlobalLoader message="Loading dashboard..." />;
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 text-center md:text-left" style={{ paddingTop: '40px', paddingBottom: '20px' }}>
          <h1 className="text-3xl md:text-5xl font-bold text-[#4A3219] mb-3" style={{ letterSpacing: "-0.3px" }}>
            Admin Dashboard
          </h1>
          <p className="text-stone-500 text-base md:text-lg">
            Manage orders and platform activity
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#F5EFE6] rounded-2xl border border-[#E6DCCF] shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ padding: '32px' }}>
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

          <div className="bg-[#F5EFE6] rounded-2xl border border-[#E6DCCF] shadow-sm hover:shadow-md transition-shadow flex flex-col" style={{ padding: '32px' }}>
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
        </div>
      </div>
    </main>
  );
}
