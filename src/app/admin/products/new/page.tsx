"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { isAdmin } from "@/lib/isAdmin";
import GlobalLoader from "@/components/ui/GlobalLoader";
import ProductForm from "../ProductForm";
import BackButton from "@/components/BackButton";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    let isRedirecting = false;
    let isMounted = true;
    
    const checkAuth = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        if (authError) {
          console.warn("Auth check error (bypassing strict redirect):", authError);
        } else if (!authData?.session?.user || !isAdmin(authData.session.user)) {
          isRedirecting = true;
          router.push("/");
          return;
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        if (isMounted && !isRedirecting) {
          setLoading(false);
        }
      }
    };
    checkAuth();

    // Show reload button after 3 seconds if still loading
    const reloadTimer = setTimeout(() => {
      if (isMounted) setShowReload(true);
    }, 3000);

    // Safety timeout
    const safety = setTimeout(() => {
      if (isMounted && !isRedirecting) {
        setLoading(false);
      }
    }, 5000);
    
    return () => {
      isMounted = false;
      clearTimeout(reloadTimer);
      clearTimeout(safety);
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] py-10 md:py-20 px-3 md:px-4">
        <div className="max-w-4xl mx-auto" style={{ paddingTop: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div className="w-10 h-10 bg-[#EAE1D3] rounded-full animate-pulse" />
            <div className="h-10 w-48 bg-[#EAE1D3] rounded-xl animate-pulse" />
          </div>
          <div className="h-5 w-64 bg-[#EAE1D3] rounded-lg animate-pulse mb-8 ml-[44px]" />
          
          <div className="bg-[#F5EFE6] rounded-2xl p-6 border border-[#E6DCCF] space-y-6 animate-pulse">
            <div className="h-12 w-full bg-[#EAE1D3] rounded-xl" />
            <div className="h-32 w-full bg-[#EAE1D3] rounded-xl" />
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

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-10 md:py-20 px-3 md:px-4">
      <div className="max-w-4xl mx-auto" style={{ paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <BackButton />
          <h1 className="text-2xl md:text-4xl font-bold text-[#4A3219]" style={{ margin: 0 }}>Add New Product</h1>
        </div>
        <p className="text-sm md:text-base text-[#8B7355]" style={{ marginBottom: '1.25rem', marginLeft: '44px' }}>Create a new item in your catalog</p>
        
        <ProductForm isEdit={false} />
      </div>
    </main>
  );
}
