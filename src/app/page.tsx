import { getLiveProducts } from "@/lib/productsApi";
import ProductCard from "@/components/ProductCardV2";
import HeroSection from "@/components/HeroSection";

import Link from "next/link";
import { Product } from "@/types";
import { getLiveCategories } from "@/lib/categoriesApi";

export const metadata = {
  title: "Handmade Collections — Keshvi Crafts",
  description: "Limited-run artisanal crochet pieces.",
};

export const revalidate = 60;

export default async function Home() {
  const liveProducts = await getLiveProducts();
  const live = liveProducts as Product[];

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
  const activeCategoriesMap = Array.from(new Set(live.map(p => p.category || '')));
  const allLiveCategories = await getLiveCategories();
  const displayCats = allLiveCategories.filter(c => activeCategoriesMap.includes(c.name));

  return (
    <main>
      {/* Hero Section */}
      <HeroSection />

      <div className="container py-40 mt-10">
      
        {/* Section 1: Popular Handmade Picks */}
        {section1.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
                Popular Handmade Picks
              </h2>
              <Link href="/collections" className="meta hover:underline" style={{ color: "var(--brand)" }}>
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

        {/* Section 2: Best Sellers (Auto-badged) */}
        {section2.length > 0 && (
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
              {section2.map((p) => (
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
                const count = live.filter((p) => (p.category || '') === cat.name).length;
                const slug = cat.slug;
                return (
                  <Link
                    key={cat.id}
                    href={`/collections/${slug}`}
                    className="collection-chip"
                  >
                    {cat.name}
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

        {/* Section 3: Trending Now */}
        {section3.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold" style={{ color: "var(--text)" }}>
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
              Crafted on request • Ships across India
            </p>

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
