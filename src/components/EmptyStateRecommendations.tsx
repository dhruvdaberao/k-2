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
      <div className="w-full mt-6 pb-10">
        <h3 className="text-xl md:text-2xl font-serif font-bold text-[#2f2a26] mb-6 text-center">{title}</h3>
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
    <div className="w-full mt-6 pb-10">
      <h3 className="text-xl md:text-2xl font-serif font-bold text-[#2f2a26] mb-6 text-center">{title}</h3>
      <div className="plp-grid-mobile text-left">
        {products.map((p) => (
          <ProductCard key={p.id || p.slug} p={p} priority={true} />
        ))}
      </div>
    </div>
  );
}
