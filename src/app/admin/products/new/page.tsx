"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import GlobalLoader from "@/components/ui/GlobalLoader";
import ProductForm from "../ProductForm";
import BackButton from "@/components/BackButton";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: authData } = await supabase.auth.getSession();
        if (!authData?.session?.user || authData.session.user.email !== "keshvicrafts@gmail.com") {
          router.push("/");
          return;
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    // Safety: never show loading for more than 5 seconds
    const safety = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(safety);
  }, []);

  if (loading) return <GlobalLoader message="Authenticating..." />;

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-10 md:py-20 px-3 md:px-4">
      <div className="max-w-4xl mx-auto" style={{ paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <BackButton />
          <h1 className="text-xl md:text-3xl font-bold text-[#4A3219]" style={{ margin: 0 }}>Add New Product</h1>
        </div>
        <p className="text-sm md:text-base text-[#8B7355]" style={{ marginBottom: '1.25rem', marginLeft: '44px' }}>Create a new item in your catalog</p>
        
        <ProductForm isEdit={false} />
      </div>
    </main>
  );
}
