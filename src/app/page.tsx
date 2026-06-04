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
  // Run ALL database queries concurrently to eliminate waterfall delays
  const [
    liveProducts,
    allLiveCategories,
    slidesRes,
    timerRes
  ] = await Promise.all([
    getLiveProducts(),
    getLiveCategories(),
    supabase.from("hero_slides").select("*").eq("is_active", true).order("position", { ascending: true }),
    supabase.from("site_settings").select("setting_value").eq("setting_key", "carousel_delay").single()
  ]);

  const live = liveProducts as Product[];
  const displayCats = allLiveCategories;

  // 1. Process Dynamic Carousel Data
  let heroSlides = [];
  let carouselDelay = 4500;
  
  if (slidesRes.data && slidesRes.data.length > 0) {
    heroSlides = slidesRes.data;
  }
  if (timerRes.data?.setting_value?.ms) {
    carouselDelay = timerRes.data.setting_value.ms;
  }

  // 1. Priority Sorting (DESC priority, ASC rating, ASC price)
  const sortedProducts = [...live].sort((a, b) => {
    const pA = a.priority ?? -9999;
    const pB = b.priority ?? -9999;
    if (pA !== pB) return pB - pA;
    const rA = a.rating ?? 0;
    const rB = b.rating ?? 0;
    if (rA !== rB) return rB - rA;
    return a.price - b.price;
  });

  // Track rendered slugs to prevent duplication
  const renderedSlugs = new Set<string>();

  const getSectionProducts = (sectionName: string, maxCount: number) => {
    // 1. Get explicitly assigned products
    const explicit = sortedProducts.filter(p => p.homeSection === sectionName && !renderedSlugs.has(p.slug));
    
    // 2. Mark as rendered
    explicit.forEach(p => renderedSlugs.add(p.slug));
    
    // 3. Fill remaining slots automatically with top unassigned products
    const needed = maxCount - explicit.length;
    const automatic: Product[] = [];
    
    if (needed > 0) {
      for (const p of sortedProducts) {
        if (!p.homeSection || p.homeSection === 'none') {
          if (!renderedSlugs.has(p.slug)) {
            automatic.push(p);
            renderedSlugs.add(p.slug);
            if (automatic.length >= needed) break;
          }
        }
      }
    }
    
    return [...explicit, ...automatic].slice(0, maxCount);
  };

  // 2. Build Home Page Sections
  const section1 = getSectionProducts('popular-picks', 6);
  const section2 = getSectionProducts('best-sellers', 4).map(p => ({ ...p, badge: 'Bestseller' }));
  const section3 = getSectionProducts('trending', 4);
  const section4 = getSectionProducts('handmade', 8);

  // Categories (Unique Display Categories)
  // (Fetched concurrently above)

  return (
    <main>
      {/* Hero Section */}
      <HeroSection slides={heroSlides} autoPlayMs={carouselDelay} />

      <div className="container pt-0 md:pt-5" style={{ paddingBottom: '30px' }}>
        {/* Shop by Collection Section */}
        {displayCats.length > 0 && (
          <section className="home-section mt-16 md:mt-32 mb-8 md:mb-24">
            <div className="flex items-center justify-between gap-2 custom-section-header">
              <h2 className="home-section-title font-bold truncate" style={{ color: "var(--text)" }}>
                Shop by Collection
              </h2>
            </div>
            <div className="category-chips-scroll home-category-chips mb-0 md:mb-6 md:gap-16 px-4 md:px-0">
              {displayCats.map((cat) => {
                const count = live.filter((p) => (p.category || '') === cat.name).length;
                const slug = cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/collections/${slug}`}
                    className="flex flex-col items-center gap-2 group min-w-[80px] md:min-w-[115px] lg:min-w-[170px] shrink-0"
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
                    <span className="category-label text-center group-hover:text-[var(--brand)] transition-colors">
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
                <span className="category-label text-center group-hover:text-[var(--brand)] transition-colors">
                  View All
                </span>
              </Link>
            </div>
          </section>
        )}

        {/* Section 1: Popular Picks */}
        {section1.length > 0 && (
          <section className="home-section mt-16 md:mt-32 mb-8 md:mb-24">
            <div className="flex items-center justify-between gap-2 custom-section-header">
              <h2 className="home-section-title font-bold truncate" style={{ color: "var(--text)" }}>
                Signature Picks
              </h2>
              <Link 
                href="/collections?section=popular-picks" 
                className="shrink-0 transition-opacity hover:opacity-80 flex items-center justify-center gap-1 text-[#8B7355]" 
                aria-label="View All"
              >
                <span className="text-[14px] md:text-[16px] lg:text-[18px] font-medium">View all</span>
                <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </Link>
            </div>
            <div className="plp-grid-mobile">
              {section1.map((p) => (
                <ProductCard key={p.slug} p={p} priority={true} />
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Best Sellers (Auto-badged) */}
        {section2.length > 0 && (
          <section className="home-section mt-16 md:mt-32 mb-8 md:mb-24">
            <div className="flex items-center justify-between gap-2 custom-section-header">
              <h2 className="home-section-title font-bold truncate" style={{ color: "var(--text)" }}>
                Best Sellers
              </h2>
              <Link 
                href="/collections?section=best-sellers" 
                className="shrink-0 transition-opacity hover:opacity-80 flex items-center justify-center gap-1 text-[#8B7355]" 
                aria-label="View All"
              >
                <span className="text-[14px] md:text-[16px] lg:text-[18px] font-medium">View all</span>
                <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </Link>
            </div>
            <div className="plp-grid-mobile">
              {section2.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        )}



        {/* About / Why Handmade Section - Moved here to break up the product grids and tell the brand story! */}
        <WhyHandmadeSection />

        {/* Section 3: New Arrivals */}
        {section3.length > 0 && (
          <section className="home-section mt-16 md:mt-32 mb-8 md:mb-24">
            <div className="flex items-center justify-between gap-2 custom-section-header">
              <h2 className="home-section-title font-bold truncate" style={{ color: "var(--text)" }}>
                New Arrivals
              </h2>
              <Link 
                href="/collections?section=new-arrivals" 
                className="shrink-0 transition-opacity hover:opacity-80 flex items-center justify-center gap-1 text-[#8B7355]" 
                aria-label="View All"
              >
                <span className="text-[14px] md:text-[16px] lg:text-[18px] font-medium">View all</span>
                <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </Link>
            </div>
            <div className="plp-grid-mobile">
              {section3.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Fallback / Category-based mapping */}
        {section4.length > 0 && (
          <section className="home-section mt-16 md:mt-32 mb-8 md:mb-24">
            <div className="flex items-center justify-between gap-2 custom-section-header">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold truncate" style={{ color: "var(--text)" }}>
                Our Favorites
              </h2>
              <Link 
                href="/collections?section=handmade" 
                className="shrink-0 transition-opacity hover:opacity-80 flex items-center justify-center gap-1 text-[#8B7355]" 
                aria-label="View All"
              >
                <span className="text-[14px] md:text-[16px] lg:text-[18px] font-medium">View all</span>
                <svg className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
              </Link>
            </div>

            <div className="plp-grid-mobile">
              {section4.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>

            {live.length > renderedSlugs.size && (
              <div className="text-center mt-8">
                <Link href="/collections" className="btn-luxe view-all-pill">
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
