import { getLiveProducts } from "@/lib/productsApi";
import ProductCard from "@/components/ProductCardV2";
import HeroSection from "@/components/HeroSection";
import WhyHandmadeSection from "@/components/WhyHandmadeSection";

import Link from "next/link";
import { Product } from "@/types";
import { getLiveCategories } from "@/lib/categoriesApi";
import { supabase } from "@/lib/supabaseClient";

export const metadata = {
  title: "Handmade Collections — Keshvi Crafts",
  description: "Limited-run artisanal crochet pieces.",
};

export const revalidate = 3600;

export default async function Home() {
  const liveProducts = await getLiveProducts();
  const live = liveProducts as Product[];

  // 1. Fetch Dynamic Carousel Data
  let heroSlides = [];
  let carouselDelay = 4500;
  
  try {
    const [slidesRes, timerRes] = await Promise.all([
      supabase.from("hero_slides").select("*").eq("is_active", true).order("position", { ascending: true }),
      supabase.from("site_settings").select("setting_value").eq("setting_key", "carousel_delay").single(),
    ]);
    
    if (slidesRes.data && slidesRes.data.length > 0) {
      heroSlides = slidesRes.data;
    }
    if (timerRes.data?.setting_value?.ms) {
      carouselDelay = timerRes.data.setting_value.ms;
    }
  } catch (err) {
    console.error("Error fetching carousel data:", err);
  }

  // 1. Priority Sorting (DESC priority, ASC price)
  const sortedProducts = [...live].sort((a, b) => {
    const pA = a.priority ?? -9999;
    const pB = b.priority ?? -9999;
    if (pA !== pB) return pB - pA;
    return a.price - b.price;
  });

  // Track rendered slugs to prevent duplication
  const renderedSlugs = new Set<string>();

  const getDeduplicated = (list: Product[], count: number) => {
    const output: Product[] = [];
    for (const p of list) {
      if (!renderedSlugs.has(p.slug)) {
        output.push(p);
        renderedSlugs.add(p.slug);
      }
      if (output.length >= count) break;
    }
    return output;
  };

  // 2. Pure Priority Slicing for Home Page Sections
  const section1 = sortedProducts.slice(0, 6);
  const section2 = sortedProducts.slice(6, 10).map(p => ({ ...p, badge: 'Bestseller' }));
  const section3 = sortedProducts.slice(10, 14);
  const section4 = sortedProducts.slice(14, 22);

  // Categories (Unique Display Categories)
  const allLiveCategories = await getLiveCategories();
  const displayCats = allLiveCategories;

  return (
    <main>
      {/* Hero Section */}
      <HeroSection slides={heroSlides} autoPlayMs={carouselDelay} />

      <div className="container pt-1 md:pt-5" style={{ paddingBottom: '30px' }}>
        {/* Shop by Collection Section */}
        {displayCats.length > 0 && (
          <section className="mb-10 md:mb-16 mt-4 md:mt-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6" style={{ color: "var(--text)" }}>
              Shop by Collection
            </h2>
            <div className="category-chips-scroll mb-4 md:mb-8">
              {displayCats.map((cat) => {
                const count = live.filter((p) => (p.category || '') === cat.name).length;
                const slug = cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/collections/${slug}`}
                    className="flex flex-col items-center gap-2 group min-w-[80px] md:min-w-[110px] shrink-0"
                    style={{ textDecoration: 'none' }}
                  >
                    {/* Insta-story border wrapper */}
                    <div 
                      className="category-circle-fixed rounded-dashed-border rounded-full flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:drop-shadow-md active:scale-95 shrink-0"
                    >
                      <div 
                        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: '#F5EFE6' }}
                      >
                        {/* @ts-ignore */}
                        {cat.image_url ? (
                          /* @ts-ignore */
                          <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[28px] md:text-[32px] font-bold" style={{ color: '#8B7355', fontFamily: "var(--font-heading)" }}>
                            {cat.name.substring(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <span 
                      className="text-center group-hover:text-[var(--brand)] transition-colors" 
                      style={{ 
                        fontSize: '13px', 
                        fontWeight: '700', 
                        color: '#2A1A0F',
                        lineHeight: '1.2',
                        marginTop: '2px'
                      }}
                    >
                      {cat.name}
                    </span>
                  </Link>
                );
              })}
              
              <Link 
                href="/collections" 
                className="flex flex-col items-center gap-2 group min-w-[80px] md:min-w-[110px] shrink-0"
                style={{ textDecoration: 'none' }}
              >
                <div 
                  className="category-circle-fixed rounded-dashed-border rounded-full flex items-center justify-center transition-all duration-300 group-hover:-translate-y-1 group-hover:drop-shadow-md active:scale-95 shrink-0"
                >
                  <div 
                    className="w-full h-full rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: '#F5EFE6', border: 'none' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 md:w-7 md:h-7">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                </div>
                <span 
                  className="text-center group-hover:text-[var(--brand)] transition-colors" 
                  style={{ 
                    fontSize: '13px', 
                    fontWeight: '700', 
                    color: '#2A1A0F',
                    lineHeight: '1.2',
                    marginTop: '2px'
                  }}
                >
                  View All
                </span>
              </Link>
            </div>
          </section>
        )}

        {/* Section 1: Popular Handmade Picks */}
        {section1.length > 0 && (
          <section className="mb-10 md:mb-16">
            <div className="flex items-end justify-between gap-4 mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--text)" }}>
                Popular Handmade Picks
              </h2>
              <Link href="/collections" className="meta hover:underline shrink-0 pb-1" style={{ color: "var(--brand)" }}>
                View All →
              </Link>
            </div>
            <div className="plp-grid-mobile">
              {section1.map((p) => (
                <ProductCard key={p.slug} p={p} priority={true} />
              ))}
            </div>
          </section>
        )}

        {/* About / Why Handmade Section */}
        <WhyHandmadeSection />

        {/* Section 2: Best Sellers (Auto-badged) */}
        {section2.length > 0 && (
          <section className="mb-10 md:mb-16">
            <div className="flex items-end justify-between gap-4 mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--text)" }}>
                Best Sellers
              </h2>
              <Link href="/collections" className="meta hover:underline shrink-0 pb-1" style={{ color: "var(--brand)" }}>
                View All →
              </Link>
            </div>
            <div className="plp-grid-mobile">
              {section2.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        )}



        {/* Section 3: Trending Now */}
        {section3.length > 0 && (
          <section className="mb-10 md:mb-16">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--text)" }}>
                Trending Creations
              </h2>
              <Link href="/collections" className="meta hover:underline">
                View All →
              </Link>
            </div>
            <div className="plp-grid-mobile">
              {section3.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Featured Collections */}
        {section4.length > 0 && (
          <section className="mb-10 md:mb-16">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--text)" }}>
                Handmade Collections
              </h2>
              <Link href="/collections" className="meta hover:underline">
                View All →
              </Link>
            </div>

            <div className="plp-grid-mobile">
              {section4.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>

            {live.length > renderedSlugs.size && (
              <div className="text-center mt-8">
                <Link href="/collections" className="btn-luxe">
                  View All Products ({live.length})
                </Link>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
