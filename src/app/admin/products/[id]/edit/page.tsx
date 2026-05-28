"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import GlobalLoader from "@/components/ui/GlobalLoader";
import ProductForm from "../../ProductForm";
import BackButton from "@/components/BackButton";
import { showToast } from "@/components/Toast";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<any>(null);
  const isMounted = useRef(true);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Auth check
      const { data: authData } = await supabase.auth.getSession();
      if (!isMounted.current) return;
      if (!authData?.session?.user || authData.session.user.email !== "keshvicrafts@gmail.com") {
        router.push("/");
        return;
      }

      // Fetch product
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (!isMounted.current) return;

      if (error || !data) {
        console.error("Failed to fetch product:", error);
        showToast("Product not found");
        setInitialData(null);
      } else {
        setInitialData(data);
      }
    } catch (err) {
      console.error("Edit product fetch failed:", err);
      if (isMounted.current) setInitialData(null);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    if (id) {
      fetchData();
    }

    // Safety: never show loading for more than 5 seconds
    const safety = setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
      }
    }, 5000);
    
    return () => {
      isMounted.current = false;
      clearTimeout(safety);
    };
  }, [id]);

  if (!id) return null;

  if (loading) return <GlobalLoader message="Loading product data..." />;

  if (!initialData) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#4A3219] mb-2">Product Not Found</h1>
          <p className="text-[#8B7355] mb-6">The product could not be loaded. It may have been deleted or there was a network issue.</p>
          <button type="button" onClick={fetchData} className="px-6 py-3 rounded-xl font-bold" style={{ backgroundColor: '#4A3219', color: '#ffffff' }}>
            Retry Loading
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-10 md:py-20 px-3 md:px-4">
      <div className="max-w-4xl mx-auto" style={{ paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <BackButton />
          <h1 className="text-xl md:text-3xl font-bold text-[#4A3219]" style={{ margin: 0 }}>Edit Product</h1>
        </div>
        <p className="text-sm md:text-base text-[#8B7355]" style={{ marginBottom: '1.25rem', marginLeft: '44px' }}>Update details for {initialData?.title || 'this product'}</p>
        
        <ProductForm isEdit={true} initialData={initialData} />
      </div>
    </main>
  );
}
