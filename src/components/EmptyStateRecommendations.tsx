"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Product } from "@/types";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

export default function EmptyStateRecommendations({ title }: { title: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    async function fetchBestSellers() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("status", "live")
          .order("priority", { ascending: false })
          .limit(4);

        if (error) throw error;
        setProducts(data as Product[]);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBestSellers();
  }, []);

  const handleAddToBag = (p: Product) => {
    addToCart(p);
    showToast(`${p.title} added to bag!`);
  };

  const handleBuyNow = (p: Product) => {
    addToCart(p);
    router.push("/cart");
  };

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto mt-6 pb-10">
        <h3 className="text-xl md:text-2xl font-serif font-bold text-[#2f2a26] mb-6 text-center">{title}</h3>
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-4 p-3 rounded-2xl border border-stone-100 shadow-sm animate-pulse" style={{ backgroundColor: '#F5EFE6' }}>
              <div className="shrink-0 w-[90px] h-[90px] bg-[#EAE1D3] rounded-xl" />
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="h-5 w-3/4 bg-[#EAE1D3] rounded mb-2"></div>
                  <div className="h-4 w-1/4 bg-[#EAE1D3] rounded"></div>
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="h-8 flex-1 bg-[#EAE1D3] rounded-xl"></div>
                  <div className="h-8 flex-1 bg-[#EAE1D3] rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-6 pb-10">
      <h3 className="text-xl md:text-2xl font-serif font-bold text-[#2f2a26] mb-6 text-center">{title}</h3>
      <div className="flex flex-col gap-4 text-left px-2">
        {products.map((p) => {
          const mainImage = p.images?.[0] || '/placeholder.png';
          const href = `/products/${encodeURIComponent(p.slug)}`;
          const isOutOfStock = typeof p.stock === "number" && p.stock <= 0 && p.type !== "custom-order";
          
          return (
            <div key={p.id || p.slug} className="flex gap-4 p-3 rounded-2xl transition-transform hover:scale-[1.01] shadow-sm border border-stone-100" style={{ backgroundColor: '#F5EFE6' }}>
              <a href={href} className="block shrink-0 relative w-[90px] h-[90px] rounded-xl overflow-hidden bg-stone-200">
                <img src={mainImage} alt={p.title} className="object-cover w-full h-full" />
              </a>
              <div className="flex-1 flex flex-col justify-between py-1 overflow-hidden">
                <div>
                  <a href={href} className="block text-[#2f2a26] hover:text-[#8B7355] transition-colors truncate">
                    <h4 className="font-bold text-[16px] md:text-[18px] truncate">{p.title}</h4>
                  </a>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-bold text-[#2f2a26] text-[15px] md:text-[17px]">₹{p.price}</span>
                    {p.rating && (
                      <div className="flex items-center gap-1 text-[#8B7355] text-[13px] md:text-[14px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        <span className="font-medium mt-[1px]">{p.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {isOutOfStock ? (
                  <div className="mt-2 text-center py-2 rounded-xl text-[#F5EFE6] font-bold text-[12px] md:text-[14px]" style={{ backgroundColor: '#8B7355', opacity: 0.7 }}>
                    Out of Stock
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => handleAddToBag(p)}
                      className="flex-1 py-2 px-2 rounded-xl text-[#4A3219] font-bold text-[12px] md:text-[13px] transition-transform active:scale-95 border border-[rgba(74,50,25,0.3)] hover:border-[#4A3219] hover:bg-[rgba(74,50,25,0.05)]"
                      style={{ backgroundColor: 'transparent' }}
                    >
                      Add to Bag
                    </button>
                    <button 
                      onClick={() => handleBuyNow(p)}
                      className="flex-1 py-2 px-2 rounded-xl text-[#F5EFE6] font-bold text-[12px] md:text-[13px] transition-transform active:scale-95 shadow-sm hover:opacity-90"
                      style={{ backgroundColor: '#4A3219' }}
                    >
                      Buy Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
