"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import GlobalLoader from "@/components/ui/GlobalLoader";
import ProductForm from "../../ProductForm";
import BackButton from "@/components/BackButton";
import { showToast } from "@/components/Toast";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Auth check
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user || authData.user.email !== "keshvicrafts@gmail.com") {
          router.push("/");
          return;
        }

        // Fetch product
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error || !data) {
          console.error("Failed to fetch product:", error);
          showToast("Product not found");
          router.push("/admin/products");
          return;
        }

        setInitialData(data);
      } catch (err) {
        console.error("Edit product fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();

    // Safety: never show loading for more than 5 seconds
    const safety = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(safety);
  }, [params.id, router]);

  if (loading) return <GlobalLoader message="Loading product data..." />;

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-10 md:py-20 px-3 md:px-4">
      <div className="max-w-4xl mx-auto" style={{ paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <BackButton />
          <h1 className="text-xl md:text-3xl font-bold text-[#4A3219]" style={{ margin: 0 }}>Edit Product</h1>
        </div>
        <p className="text-sm md:text-base text-[#8B7355]" style={{ marginBottom: '1.25rem', marginLeft: '44px' }}>Update details for {initialData.title}</p>
        
        <ProductForm isEdit={true} initialData={initialData} />
      </div>
    </main>
  );
}
