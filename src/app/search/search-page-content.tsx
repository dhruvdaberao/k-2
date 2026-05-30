"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { Product } from "@/types";
import ProductCard from "@/components/ProductCardV2";
import "./search.css";

export default function SearchPageContent() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("*").then(({ data }: { data: any }) => {
      if (data) setProducts(data as Product[]);
    }).catch((err: any) => console.error("Search fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const liveProducts = useMemo(
    () =>
      products.filter(
        (p) => (p.status ?? "live") !== "hidden" && !p.isVariant,
      ),
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return liveProducts;
    }

    return liveProducts.filter((p) => {
      const name = (p.title ?? "").toLowerCase();
      const category = (p.category ?? "").toLowerCase();
      const price = String(p.minPrice ?? p.price ?? "").toLowerCase();
      return name.includes(q) || category.includes(q) || price.includes(q);
    });
  }, [liveProducts, query]);

  return (
    <main className="search-page container">
      <header className="search-page__top">
        <button
          type="button"
          className="search-page__back"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>

        <div className="search-page__input-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-page__icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-page__input"
            placeholder="Search name, category, or price"
            aria-label="Search products"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="search-page__clear"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </header>

      <section className="search-page__results" aria-live="polite">
        {loading ? (
          <div className="search-page__empty">Loading products...</div>
        ) : filtered.length === 0 ? (
          <div className="search-page__empty">No matching products found.</div>
        ) : (
          <div className="plp-grid-mobile">
            {filtered.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
