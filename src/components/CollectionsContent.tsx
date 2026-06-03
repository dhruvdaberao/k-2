// app/collections/CollectionsContent.tsx
"use client";

import { getLiveCategories, Category } from "@/lib/categoriesApi";
import ProductCard from "@/components/ProductCardV2";
import BottomSheet from "@/components/BottomSheet";
import CategoryChips from "@/components/CategoryChips";
import CollectionsSortDropdown from "@/components/CollectionsSortDropdown";
import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Product } from "@/types";

type SortOption = "default" | "price-low" | "price-high" | "newest";

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Forever Blooms": "Welcome to our Forever Blooms collection, where the beauty of nature meets the timeless art of crochet. Each handmade flower in this collection is carefully crafted to bring everlasting joy to your home or office. Unlike real flowers that fade and wilt with the passing seasons, these exquisite crochet blooms retain their vibrant color, perfect shape, and delightful charm forever. This makes them the ultimate zero-maintenance decor solution or a deeply heartfelt gift that your loved ones can cherish indefinitely. Whether you are searching for bright, cheerful sunflowers to liven up your workspace, elegant, classic roses for a timeless romantic gesture, or a custom bespoke bouquet for a very special milestone, our artisans have poured countless hours of delicate, intricate stitching into every single petal. We use only the finest, premium yarns to ensure that these floral creations look absolutely stunning from every angle. Embrace the unique beauty of slow, sustainable craftsmanship with our floral arrangements that truly stand the test of time, adding a permanent, comforting touch of handmade warmth to any room you place them in.",
  "Soft Fits": "Discover the Soft Fits collection, a curated selection of handmade crochet clothing that redefines comfort and style. In a world dominated by fast fashion, our crochet apparel stands out by celebrating slow, intentional craftsmanship. Every top, scarf, and wearable piece in this collection is meticulously designed and stitched by hand, creating a truly unique garment that you won't find anywhere else. We use soft, breathable, and highly durable yarns that feel gentle against the skin while providing excellent structure and fit. From trendy crop tops perfect for summer festivals to cozy wrap accessories for cooler evenings, our clothing items are highly versatile and fashion-forward. Because each piece is often made to order, we ensure a level of personalization and quality control that mass-produced clothing simply cannot match. Elevate your wardrobe with these artisanal creations that not only look incredibly stylish but also support sustainable fashion practices and traditional crafting techniques.",
  "Home Feelings": "Welcome to the Home Feelings collection, where we believe that your living space should be a true reflection of warmth and personality. This thoughtfully curated range of handmade crochet home decor is designed to add a cozy, inviting, and highly personalized touch to any room. Decorating with handmade items introduces a unique character and charm that commercially manufactured goods cannot replicate. Our collection features everything from beautiful traditional torans that grace your entrance with festive elegance, to adorable amigurumi figures and intricate curtain ties that serve as perfect conversation starters. Each decor piece is the result of many hours of focused, passionate craftsmanship, utilizing premium materials to ensure they become long-lasting additions to your home. By incorporating these crochet accents into your interior design, you create an environment that feels lived-in, loved, and deeply authentic. Transform your house into a truly handcrafted home with our exclusive decor items that celebrate the timeless beauty of artisanal skill.",
  "Carry Stories": "Explore the Carry Stories collection, featuring our beautifully handcrafted crochet bags and purses designed for those who appreciate functional art. A bag is more than just a convenient accessory; it is a statement piece that carries your daily essentials along with your unique personal style. Each piece in this collection, from spacious granny square tote bags to compact and charming coin purses, is sturdy, reliable, and incredibly fashionable. Our artisans dedicate hours to ensuring that the handles are reinforced and the stitches are tight, so your crochet bag is as durable as it is beautiful. Whether you are heading to the local farmer's market, enjoying a casual brunch with friends, or simply running everyday errands, these handmade bags provide the perfect blend of practicality and boho-chic aesthetics. Stand out from the crowd with a sustainable, ethically made accessory that tells a story of dedicated craftsmanship, slow fashion, and individuality with every single stitch.",
  "Little Things": "Welcome to the Little Things collection, a delightful assortment of handmade crochet accessories, keyrings, and small treasures that bring immense joy to everyday life. We believe that true beauty often lies in the smallest details, and this collection perfectly embodies that philosophy. These miniature masterpieces, ranging from cute strawberry keychains to practical earpod holders and charming scrunchies, are crafted with the exact same level of precision and care as our larger items. They are the perfect way to add a subtle, personalized pop of color and handmade charm to your keys, backpacks, or daily outfits. Furthermore, these items make incredibly thoughtful, unique gifts for friends, family, or colleagues for any occasion. Every single stitch is a testament to the patience and skill of our artisans. Browse through these small wonders and discover how integrating handmade art into your daily routine can bring a constant, comforting reminder of creativity, care, and traditional craftsmanship."
};

export default function CollectionsContent({ serverCategory, liveProducts = [], liveCategories = [] }: { serverCategory?: string, liveProducts?: Product[], liveCategories?: Category[] }) {
  const searchParams = useSearchParams();
  const categoryParam = serverCategory || searchParams.get("category");
  const tagParam = searchParams.get("tag");
  const maxPriceParam = searchParams.get("maxPrice");
  const qParam = searchParams.get("q");
  const sectionParam = searchParams.get("section");

  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [category, setCategory] = useState<string | null>(categoryParam);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const categories = liveCategories || [];

  useEffect(() => {
    if (categoryParam) setCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    setShowFullDescription(false);
  }, [category]);

  const live = useMemo(() => {
    const all = liveProducts.filter(p => (p.status ?? "live") !== "hidden" && !p.isVariant);
    const seen = new Set();
    return all.filter(p => {
      if (seen.has(p.slug)) return false;
      seen.add(p.slug);
      return true;
    });
  }, []);


  const filtered = useMemo(() => {
    let result = live;

    if (sectionParam) {
      result = result.filter(p => p.homeSection === sectionParam);
    }

    if (qParam) {
      const query = qParam.toLowerCase().trim();
      result = result.filter((p) => 
        p.title.toLowerCase().includes(query) || 
        p.category?.toLowerCase().includes(query) ||
        p.tags?.some(pt => pt.toLowerCase().includes(query)) ||
        p.slug.toLowerCase().includes(query)
      );
    }

    if (category) {
      result = result.filter((p) => (p.category || "") === category);
    }

    if (tagParam) {
      const t = tagParam.toLowerCase().trim();
      result = result.filter(p => p.tags?.some(pt => pt.toLowerCase().trim() === t));
    }

    if (maxPriceParam) {
      const mp = parseInt(maxPriceParam, 10);
      if (!isNaN(mp)) {
        result = result.filter(p => (p.minPrice || p.price) <= mp);
      }
    }

    return result;
  }, [live, category, tagParam, maxPriceParam, qParam, sectionParam]);

  const sorted = useMemo(() => {
    const data = [...filtered];
    switch (sortBy) {
      case "price-low":
        return data.sort((a, b) => (a.minPrice || a.price) - (b.minPrice || b.price));
      case "price-high":
        return data.sort((a, b) => (b.minPrice || b.price) - (a.minPrice || a.price));
      case "newest":
        return data.sort((a, b) => {
          const aNew = a.badges?.includes("New") || a.badge === "New" ? 1 : 0;
          const bNew = b.badges?.includes("New") || b.badge === "New" ? 1 : 0;
          if (aNew !== bNew) return bNew - aNew;
          return (b.priority ?? -9999) - (a.priority ?? -9999);
        });
      case "default":
      default:
        return data.sort((a, b) => {
          const pA = a.priority ?? -9999;
          const pB = b.priority ?? -9999;
          if (pA !== pB) return pB - pA;
          return (a.minPrice || a.price) - (b.minPrice || b.price);
        });
    }
  }, [filtered, sortBy]);

  const handleApplyFilters = () => {
    setFiltersOpen(false);
  };

  const handleResetFilters = () => {
    setCategory(null);
    setFiltersOpen(false);
  };

  const getPageTitle = () => {
    if (qParam) return `Search Results for "${qParam}"`;
    if (tagParam) return `${tagParam.charAt(0).toUpperCase() + tagParam.slice(1)} Collection`;
    if (maxPriceParam) return `Under ₹${maxPriceParam}`;
    if (sectionParam) {
      if (sectionParam === "popular-picks") return "Popular Picks";
      if (sectionParam === "best-sellers") return "Best Sellers";
      if (sectionParam === "trending") return "Trending Creations";
      if (sectionParam === "handmade") return "Handmade Collections";
      return "Collection";
    }
    if (category) return `${category} Collection`;
    return "Collections";
  }

  return (
    <>
      <div className="collections-header text-center">
        <h1 className="collections-title">
          {getPageTitle()}
        </h1>
        {category && CATEGORY_DESCRIPTIONS[category] && (
          <div className="collections-description-wrap">
            <p className={`text-stone-600 mb-2 text-sm md:text-base mt-4 max-w-4xl leading-relaxed mx-auto text-left ${showFullDescription ? "" : "collections-description-clamped"}`}>
              {CATEGORY_DESCRIPTIONS[category]}
            </p>
            <button
              type="button"
              className="collections-description-toggle"
              onClick={() => setShowFullDescription((prev) => !prev)}
            >
              {showFullDescription ? "Read Less" : "Read More"}
            </button>
          </div>
        )}
      </div>

      <CategoryChips serverCategory={serverCategory} liveCategories={categories} />

      <div className="collections-control-bar">
        <div className="collections-result-count items-count">{sorted.length} items</div>
        <div className="collections-controls-right">
          <button
            className="collections-filter-btn"
            onClick={() => setFiltersOpen(true)}
            aria-label="Open filters"
          >
            Filter
          </button>
          <CollectionsSortDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {sorted.length === 0 ? (
        <div 
          className="py-16 px-6 text-center shadow-sm"
          style={{ backgroundColor: '#F5EFE6', borderRadius: '24px', border: '1px solid #E6DCCF', margin: '2rem 0' }}
        >
          <div className="text-5xl mb-5 flex justify-center text-[#8B7355]">
            {!qParam ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                <rect x="3" y="14" width="7" height="7" rx="1"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            )}
          </div>
          <p className="text-xl md:text-2xl font-bold text-[#4A3219] mb-3">
            {qParam ? "No products found" : "Currently no products in this category"}
          </p>
          <p className="text-[#8B7355] mb-8 max-w-md mx-auto text-sm md:text-base">
            {qParam 
              ? "We couldn't find anything matching your search. Try adjusting your keywords or browse our full collection."
              : "We are currently crafting new items for this collection. Please check back later or explore our other creations."}
          </p>
          <button
            className="btn-primary px-8 py-3"
            onClick={handleResetFilters}
          >
            Browse all products
          </button>
        </div>
      ) : (
        <div className="plp-grid-mobile">
          {sorted.map((p, index) => (
            <ProductCard key={p.slug} p={p} priority={index < 4} />
          ))}
        </div>
      )}

      <BottomSheet
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
      >
        <div className="bottom-sheet-filters">
          <div className="filter-group">
            <label className="filter-group-label">Category</label>
            <div className="filter-options">
              <button
                className={`filter-option ${!category ? "active" : ""}`}
                onClick={() => setCategory(null)}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`filter-option ${category === cat.name ? "active" : ""}`}
                  onClick={() => setCategory(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          <div className="bottom-sheet-actions">
            <button
              className="bottom-sheet-btn-secondary"
              onClick={handleResetFilters}
            >
              Reset
            </button>
            <button
              className="bottom-sheet-btn-primary"
              onClick={handleApplyFilters}
            >
              Apply
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
