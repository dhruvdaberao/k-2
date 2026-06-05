"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ProductCard from "@/components/ProductCardV2";
import type { Product } from "@/types";

export default function EmptyStateRecommendations({ title }: { title: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="mt-12 w-full max-w-5xl mx-auto border-t border-[rgba(139,94,60,0.1)] pt-10">
        <h3 className="text-xl md:text-2xl font-bold font-serif text-[#2f2a26] mb-6 text-center">{title}</h3>
        <div className="plp-grid-mobile">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="overflow-hidden border border-stone-100 shadow-sm animate-pulse" style={{ backgroundColor: '#F5EFE6', borderRadius: '24px' }}>
              <div className="w-full aspect-square bg-[#EAE1D3]" />
              <div className="p-3">
                <div className="h-4 w-3/4 bg-[#EAE1D3] rounded mb-2"></div>
                <div className="h-5 w-1/3 bg-[#EAE1D3] rounded"></div>
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
      <div className="flex flex-col gap-4 text-left">
        {products.map((p) => {
          const mainImage = p.images?.[0] || '/placeholder.png';
          const href = `/products/${encodeURIComponent(p.slug)}`;
          
          return (
            <div key={p.id || p.slug} className="flex items-center gap-4 p-3 rounded-[20px] transition-transform hover:scale-[1.01]" style={{ backgroundColor: '#F5EFE6' }}>
              <a href={href} className="block shrink-0 relative w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-2xl overflow-hidden bg-stone-200">
                <img src={mainImage} alt={p.title} className="object-cover w-full h-full" />
              </a>
              <div className="flex-1 flex flex-col justify-center overflow-hidden">
                <a href={href} className="block text-[#2f2a26] hover:text-[#8B7355] transition-colors truncate">
                  <h4 className="font-bold text-[15px] md:text-[17px] truncate">{p.title}</h4>
                </a>
                <div className="flex items-center gap-2 mt-1 mb-2">
                  <span className="font-bold text-[#2f2a26] text-[15px] md:text-[17px]">₹{p.price}</span>
                  {p.rating && (
                    <div className="flex items-center gap-1 text-[#8B7355] text-[13px] md:text-[14px]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      <span className="font-medium mt-[1px]">{p.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <a href={href} className="flex-1 flex items-center justify-center py-2 px-4 rounded-xl text-white font-bold text-[13px] md:text-[14px] transition-transform active:scale-95" style={{ backgroundColor: '#4A3219' }}>
                    View Details
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
