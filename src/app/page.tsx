import products from "@/data/products.json";
import ProductCard from "@/components/ProductCardV2";
import HeroSection from "@/components/HeroSection";

import Link from "next/link";
import { Product } from "@/types";
import { getDisplayCategory, DISPLAY_CATEGORIES, CATEGORY_SLUGS } from "@/lib/categories";

export const metadata = {
  title: "Handmade Collections — Keshvi Crafts",
  description: "Limited-run artisanal crochet pieces.",
};

export default function Home() {
  const live = (products as Product[]).filter(
    (p) => (p.status ?? "live") !== "hidden"
  );

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

  // 2. Collections Logic
  const normalize = (s: string) => s.toLowerCase().trim();

  // Valentine's (Dedupe first)
  const valentineRaw = sortedProducts.filter(p =>
    p.tags?.some(t => normalize(t) === "valentine")
  );
  // Important: Valentine is hero content, so we render it first.
  const valentineProducts = getDeduplicated(valentineRaw, 4);

  // 1A. Popular Handmade Picks (SEO Crawl Authority Boost)
  // Required: 6-8 top products linked via pure HTML tags.
  const popularPicks = getDeduplicated(sortedProducts, 6);

  // Best Sellers Logic:
  // 1. "Sunflower Pot" (Must be present if exists)
  // 2. Category "Flowers" or "Pots"
  // 3. Explicit Bestseller badge
  // 4. Fallback to sortedProducts

  const bestSellerPriority = sortedProducts.filter(p => {
    const title = (p.title || "").toLowerCase();
    const cat = (p.category || "").toLowerCase();
    // Check specific item
    if (title.includes("sunflower") && title.includes("pot")) return true;
    // Check categories
    if (cat === "flowers" || cat === "pots") return true;
    return false;
  });

  const explicitBestsellers = sortedProducts.filter(p =>
    p.badges?.includes("Bestseller") || p.badge === "Bestseller"
  );

  // Combine pools: Priority -> Explicit -> General
  const bestSellerPool = [...bestSellerPriority, ...explicitBestsellers, ...sortedProducts];
  const bestSellers = getDeduplicated(bestSellerPool, 4);


  // Price Collections
  const under499Raw = sortedProducts.filter(p => (p.minPrice || p.price) < 499);
  const under499 = getDeduplicated(under499Raw, 4);

  // Categories (Unique Display Categories)
  // We don't render products here, just chips. No dedupe needed for chips.
  const activeCategories = Array.from(new Set(live.map(p => getDisplayCategory(p.category || ''))));
  const displayCats = DISPLAY_CATEGORIES.filter(c => activeCategories.includes(c));

  // Featured (Top from sorted, excluding already rendered)
  // Just show whatever is left high priority
  const featuredProducts = getDeduplicated(sortedProducts, 8);

  return (
    <main>
      {/* Hero Section */}
      <HeroSection />

      <div className="container py-40 mt-10">
      


        {/* Valentine's Collection (Campaign) */}
        {valentineProducts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-2" style={{ color: "var(--brand)" }}>
                <span>💘</span> Valentine&apos;s Special
              </h2>
              <Link href="/collections?tag=valentine" className="meta hover:underline" style={{ color: "var(--brand)" }}>
                View All →
              </Link>
            </div>
            <div className="plp-grid-mobile">
              {valentineProducts.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* Popular Handmade Picks (SEO Authority) */}
        {popularPicks.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
                Popular Handmade Picks
              </h2>
            </div>
            <div className="plp-grid-mobile">
              {popularPicks.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* About / Why Handmade Section */}
        <section className="mb-12 text-center max-w-3xl mx-auto">
          <br></br>
          <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--text)" }}>
            Why Handmade?
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            Handmade isn’t just about how something is made — it’s about the care behind it.
            Every piece at Keshvi Crafts is created slowly, thoughtfully, and with intention.
            Unlike mass-produced items, handmade crochet carries warmth, individuality, and soul.
          </p>
          <div className="mt-8 text-left max-w-2xl mx-auto space-y-6">
            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: "rgba(139, 94, 60, 0.1)", color: "var(--brand)" }}>1</span>
              <div>
                <strong className="block text-lg mb-1" style={{ color: "var(--text)" }}>Made to order, not mass produced</strong>
                <p className="leading-relaxed" style={{ color: "var(--muted)" }}>Each item is started only after you place an order, reducing waste and ensuring it&apos;s made just for you.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: "rgba(139, 94, 60, 0.1)", color: "var(--brand)" }}>2</span>
              <div>
                <strong className="block text-lg mb-1" style={{ color: "var(--text)" }}>Crafted with care & attention</strong>
                <p className="leading-relaxed" style={{ color: "var(--muted)" }}>Our artisans spend hours perfecting every stitch, ensuring quality that machines simply can&apos;t match.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: "rgba(139, 94, 60, 0.1)", color: "var(--brand)" }}>3</span>
              <div>
                <strong className="block text-lg mb-1" style={{ color: "var(--text)" }}>Truly unique to you</strong>
                <p className="leading-relaxed" style={{ color: "var(--muted)" }}>No two handmade pieces are exactly alike. Your item carries individuality, warmth, and soul.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Best Sellers Section */}
        {bestSellers.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
                Best Sellers
              </h2>
              <Link href="/collections" className="meta hover:underline">
                View All →
              </Link>
            </div>
            <div className="plp-grid-mobile">
              {bestSellers.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* Shop by Collection Section */}
        {displayCats.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6" style={{ color: "var(--text)" }}>
              Shop by Collection
            </h2>
            <div className="flex flex-wrap gap-3 mb-8">
              {displayCats.slice(0, 6).map((cat) => {
                // Approximate count
                const count = live.filter((p) => getDisplayCategory(p.category || '') === cat).length;
                const slug = CATEGORY_SLUGS[cat];
                return (
                  <Link
                    key={cat}
                    href={`/collections/${slug}`}
                    className="collection-chip"
                  >
                    {cat}
                    <span className="meta ml-2">({count})</span>
                  </Link>
                );
              })}
              <Link href="/collections" className="collection-chip bg-stone-100 border-dashed text-stone-600">
                View All Collections →
              </Link>
            </div>
          </section>
        )}

        {/* Price Based (Under 499) */}
        {under499.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
                Best Under ₹499
              </h2>
              <Link href="/collections?maxPrice=499" className="meta hover:underline">
                View All →
              </Link>
            </div>
            <div className="plp-grid-mobile">
              {under499.map((p) => (
                <ProductCard key={p.slug} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* Featured Products Section (Remaining Top Priority) */}
        {featuredProducts.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
                Handmade Collections
              </h2>
              <Link href="/collections" className="meta hover:underline">
                View All →
              </Link>
            </div>
            <p className="meta mb-6">
              Crafted on request • Ships across India • Sorted by Priority
            </p>

            <div className="plp-grid-mobile">
              {featuredProducts.map((p) => (
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
