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
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user || authData.user.email !== "keshvicrafts@gmail.com") {
        router.push("/");
        return;
      }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) return <GlobalLoader message="Authenticating..." />;

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-20 px-4">
      <div className="max-w-4xl mx-auto" style={{ paddingTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <BackButton />
          <h1 className="text-3xl font-bold text-[#4A3219]" style={{ margin: 0 }}>Add New Product</h1>
        </div>
        <p className="text-[#8B7355]" style={{ marginBottom: '2rem', marginLeft: '48px' }}>Create a new item in your catalog</p>
        
        <ProductForm isEdit={false} />
      </div>
    </main>
  );
}
