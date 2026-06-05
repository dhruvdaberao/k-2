"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useParams, useRouter } from "next/navigation";
import GlobalLoader from "@/components/ui/GlobalLoader";
import ProductForm from "../../ProductForm";
import BackButton from "@/components/BackButton";
import { showToast } from "@/components/Toast";
import { isAdmin } from "@/lib/isAdmin";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [showReload, setShowReload] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const isMounted = useRef(true);

  const fetchData = async (isBackground = false) => {
    let isRedirecting = false;
    if (!id) return;
    if (!isBackground) setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (!isMounted.current) return;
      if (authError) {
        console.warn("Auth check error (bypassing strict redirect):", authError);
      } else if (!authData?.session?.user || !isAdmin(authData.session.user)) {
        isRedirecting = true;
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
      if (isMounted.current && !isRedirecting) setLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    let loadedFromCache = false;
    
    if (id) {
      try {
        const cached = localStorage.getItem("admin_products_cache");
        if (cached) {
          const parsedCache = JSON.parse(cached);
          // try to match id as string or number
          const found = parsedCache.find((p: any) => String(p.id) === String(id));
          if (found) {
            setInitialData(found);
            setLoading(false);
            loadedFromCache = true;
          }
        }
      } catch (e) { /* ignore */ }

      fetchData(loadedFromCache);
    }

    // Show reload button after 3 seconds if still loading
    const reloadTimer = setTimeout(() => {
      if (isMounted.current) setShowReload(true);
    }, 3000);

    // Safety: never show loading for more than 5 seconds
    const safety = setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
      }
    }, 5000);
    
    return () => {
      isMounted.current = false;
      clearTimeout(reloadTimer);
      clearTimeout(safety);
    };
  }, [id]);

  if (!id) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] py-10 md:py-20 px-3 md:px-4">
        <div className="max-w-4xl mx-auto" style={{ paddingTop: '10px' }}>
          <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-[#EAE1D3] rounded-full animate-pulse" />
            <div className="h-10 w-48 bg-[#EAE1D3] rounded-xl animate-pulse" />
          </div>
          <div className="h-5 w-64 bg-[#EAE1D3] rounded-lg animate-pulse mb-8 ml-[44px]" />
          
          <div className="bg-[#F5EFE6] rounded-2xl p-6 border border-[#EAE1D3] space-y-6 animate-pulse">
            <div className="h-12 bg-[#EAE1D3] rounded-xl w-full" />
            <div className="h-32 bg-[#EAE1D3] rounded-xl w-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 w-full bg-[#EAE1D3] rounded-xl" />
              <div className="h-12 w-full bg-[#EAE1D3] rounded-xl" />
            </div>
            <div className="h-48 w-full bg-[#EAE1D3] rounded-xl" />
            
            {showReload && (
              <div className="flex justify-center mt-8">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-6 py-2 bg-[#4A3219] text-white rounded-xl font-bold transition-all active:scale-95 hover:bg-[#2C1810]"
                >
                  Reload Page
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (!initialData) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#4A3219] mb-2">Product Not Found</h1>
          <p className="text-[#8B7355] mb-6">The product could not be loaded. It may have been deleted or there was a network issue.</p>
          <button type="button" onClick={() => fetchData(false)} className="btn-primary px-8 py-3 rounded-xl font-bold shadow-sm">
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
          <h1 className="text-2xl md:text-4xl font-bold text-[#4A3219]" style={{ margin: 0 }}>Edit Product</h1>
        </div>
        <p className="text-sm md:text-base text-[#8B7355]" style={{ marginBottom: '1.25rem', marginLeft: '44px' }}>Update details for {initialData?.title || 'this product'}</p>
        
        <ProductForm isEdit={true} initialData={initialData} />
      </div>
    </main>
  );
}
