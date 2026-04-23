"use client";

import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@/lib/isAdmin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminReviewsPlaceholder() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin(user)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !isAdmin(user)) return null;

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-[#4A3219] mb-4">Manage Reviews</h1>
        <p className="text-stone-500">Coming soon.</p>
      </div>
    </main>
  );
}
