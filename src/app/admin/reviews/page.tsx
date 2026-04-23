"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminReviewsPlaceholder() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

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

    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#5A3E2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-[#4A3219] mb-4">Manage Reviews</h1>
        <p className="text-stone-500">Coming soon.</p>
      </div>
    </main>
  );
}
