"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import ProductCard from "@/components/ProductCardV2";
import "./search.css";

export default function SearchPageContent({ initialProducts = [] }: { initialProducts?: Product[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const liveProducts = useMemo(
    () =>
      initialProducts.filter(
        (p) => (p.status ?? "live") !== "hidden" && !p.isVariant,
      ),
    [initialProducts],
  );

  const popularCategories = ["Accessories", "Keyrings", "Car Charms", "Bags"];

  const trendingProducts = useMemo(() => {
    return [...liveProducts]
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .slice(0, 8);
  }, [liveProducts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }

    return liveProducts.filter((p) => {
      const name = (p.title ?? "").toLowerCase();
      const category = (p.category ?? "").toLowerCase();
      const price = String(p.minPrice ?? p.price ?? "").toLowerCase();
      return name.includes(q) || category.includes(q) || price.includes(q);
    });
  }, [liveProducts, query]);

  return (
    <main className="search-page container pt-32 md:pt-56 lg:pt-[240px]">
      <header className="search-page__top">
        <button
          type="button"
          className="search-page__back global-back-btn"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
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
        {!query.trim() ? (
          <div className="search-page__suggestions">
            <h3 className="suggestions-title">Popular Categories</h3>
            <div className="suggestions-pills">
              {popularCategories.map(cat => (
                <button 
                  key={cat} 
                  type="button"
                  onClick={() => setQuery(cat)}
                  className="suggestion-pill"
                >
                  {cat}
                </button>
              ))}
            </div>

            {trendingProducts.length > 0 && (
              <>
                <h3 className="suggestions-title mt-6">You'll also like</h3>
                <div className="plp-grid-mobile">
                  {trendingProducts.map((p) => (
                    <ProductCard key={p.slug} p={p} />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 md:py-10 text-center px-4 w-full">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-[#2f2a26] mb-2">No matching products found.</h2>
            <p className="text-stone-500 mb-6 text-sm md:text-lg lg:text-xl italic">
              Try adjusting your keywords or explore our catalog.
            </p>
            <div className="mb-6 flex justify-center">
              <img src="/nav-icons/empty-search.png" alt="No Search Results" className="w-40 h-40 md:w-56 md:h-56 object-contain" />
            </div>
            <button
              className="btn-primary px-10 py-3 rounded-full font-bold"
              onClick={() => router.push('/collections')}
            >
              Browse Collections
            </button>
          </div>
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
