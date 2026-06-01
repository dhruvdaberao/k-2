"use client";

import { useState, useEffect, useCallback } from "react";
import Gallery from "@/components/Gallery";
import BuyBar from "@/components/BuyBar";
import VariantSelector from "@/components/VariantSelector";
import ProductCard from "@/components/ProductCardV2";
import Link from "next/link";
import type { Product, ProductVariant } from "@/types";
import { trackEvent } from "@/lib/analytics";
import SeoContentSection from "@/components/SeoContentSection";
import { useWishlist } from "@/hooks/useWishlist";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

export default function ProductPageClient({
  product,
  relatedProducts,
  initialRating
}: {
  product: Product;
  relatedProducts: Product[];
  initialRating: { avg: string | null; count: number };
}) {
  const router = useRouter();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [isHearted, setIsHearted] = useState(false);
  
  // Real Review State
  const [ratingData, setRatingData] = useState<{ avg: string | null; count: number }>(initialRating);

  useEffect(() => {
    setIsHearted(isWishlisted(product.id || product.slug));
  }, [product.id, product.slug, isWishlisted]);


  const [isPopping, setIsPopping] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  // Review State (Deprecated in favor of separate page)
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const onShareClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const shareData = {
          title: product.title,
          text: `Check out this beautiful ${product.title} at Keshvi Crafts!`,
          url: window.location.href,
      };

      try {
          if (navigator.share) {
              await navigator.share(shareData);
              trackEvent({
                  action: "share_product",
                  category: "Ecommerce",
                  label: product.title,
                  location: "pdp_share",
                  slug: product.slug
              });
          } else {
              await navigator.clipboard.writeText(window.location.href);
              showToast("Link copied to clipboard! 📋");
          }
      } catch (err) {
          console.error("Error sharing:", err);
      }
  };

  // Use variant images/price if variant selected, otherwise use product defaults
  const variantImages = selectedVariant?.images?.filter(img => typeof img === 'string' && img.trim() !== '');
  const currentImages = variantImages?.length ? variantImages : (product.images || ["/placeholder.png"]);
  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant?.stock ?? product.stock ?? 0;
  const inStock = typeof currentStock === "number" ? currentStock > 0 : true;
  const currentSlug = selectedVariant ? `${product.slug}-${selectedVariant.slug}` : product.slug;
  const currentTitle = selectedVariant ? `${product.title} - ${selectedVariant.name}` : product.title;

  return (
    <>
      <div className="product-page-grid">
        <div className="product-page-media product-image-container">
          <Gallery
            key={currentImages.join(',')}
            images={currentImages}
            alt={product.title}
            heartButton={
              <div className="product-page-actions" style={{ 
                position: "absolute", 
                top: "16px", 
                right: "16px", 
                display: "flex", 
                flexDirection: "row", 
                gap: "12px", 
                zIndex: 40 
              }}>
                <div 
                  className="cursor-pointer p-1"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsPopping(true);
                    setTimeout(() => setIsPopping(false), 400);
                    toggleWishlist(product);
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill={isHearted ? "#C84C35" : "rgba(0,0,0,0.15)"}
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    stroke={isHearted ? "#C84C35" : "white"}
                    className={`transition-transform duration-200 ${isPopping ? 'animate-heart-pop' : ''} hover:scale-110 active:scale-90 drop-shadow-md`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.19 5.01a5.72 5.72 0 0 0-8.09 0L12 6.12l-1.1-1.1a5.72 5.72 0 0 0-8.09 8.09l1.1 1.1L9.92 20.22a2.94 2.94 0 0 0 4.16 0L20.09 14.21l1.1-1.1a5.72 5.72 0 0 0 0-8.1z" />
                  </svg>
                </div>
                
                <button
                  onClick={onShareClick}
                  className="product-page-share flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
                  aria-label="Share product"
                  title="Share product"
                  type="button"
                  style={{ 
                    background: "none", 
                    border: "none",
                    padding: 0
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="drop-shadow-md">
                    <circle cx={18} cy={5} r={3} fill="white" /><circle cx={6} cy={12} r={3} fill="white" /><circle cx={18} cy={19} r={3} fill="white" /><line x1={8.59} y1={13.51} x2={15.42} y2={17.49}/><line x1={15.41} y1={6.51} x2={8.59} y2={10.49}/>
                  </svg>
                </button>
              </div>
            }
          />
        </div>
        <div className="product-page-details">
          <h1 style={{ marginTop: 0, fontSize: "2rem", lineHeight: 1.3, marginBottom: "1rem" }}>{product.title}</h1>

          {/* Price */}
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "1rem 0", color: "var(--brand)" }}>
            {product.type === "custom-order" ? (
              product.priceLabel || `Starts at ₹${product.minPrice || product.price}`
            ) : (
              `₹${currentPrice}`
            )}

            {(typeof currentStock === "number" && product.type !== "custom-order") && (
              <span 
                className={`px-3 py-1 rounded-full text-xs font-bold align-middle ${inStock ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`} 
                style={{ marginLeft: 12 }}
              >
                {inStock ? "In Stock" : "Out of Stock"}
              </span>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <VariantSelector
                variants={product.variants}
                onSelect={setSelectedVariant}
                selectedVariant={selectedVariant}
              />
            </div>
          )}

          {/* Actions: BuyBar or WhatsApp Enquiry */}
          <div style={{ marginBottom: "1.5rem" }}>
            {product.type === "custom-order" ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const messageText = `Hi Keshvi Crafts! I would like to enquire about this product: ${product.title} (${window.location.href})`;
                    
                    const encodedMessage = encodeURIComponent(messageText);
                    const url = `https://wa.me/917310045515?text=${encodedMessage}`;
                    window.open(url, "_blank", "noopener,noreferrer");

                    trackEvent({
                      action: "click_whatsapp_enquiry",
                      category: "Ecommerce",
                      label: product.title,
                      location: "pdp_primary",
                      slug: (product.id || product.slug)
                    });
                  }}
                  className="btn-primary w-full text-lg font-bold"
                >
                  Enquire
                </button>
              </div>
            ) : (
              <BuyBar
                slug={currentSlug}
                title={currentTitle}
                price={currentPrice}
                image={currentImages[0]}
                checkoutUrl={product.checkoutUrl}
                disabled={!inStock}
                productSlug={product.slug}
              />
            )}
          </div>

          {/* Badge */}
          <div className="flex items-center justify-between gap-2 mb-3 mt-2">
            <div className="flex flex-wrap gap-2">
              {/* 1. Render Badges (e.g. Bestseller) */}
              {Array.isArray(product.badges) && product.badges.length > 0 ? (
                product.badges.map((b: string) => (
                  <span key={b} className="product-badge" style={{
                    display: "inline-block",
                    padding: "0.3rem 0.8rem",
                    background: b === "Bestseller" ? "#2C1810" : "#BCA37F",
                    color: "#fff",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}>
                    {b}
                  </span>
                ))
              ) : product.badge ? (
                <span className="product-badge" style={{
                  display: "inline-block",
                  padding: "0.3rem 0.8rem",
                  background: product.badge === "Bestseller" ? "#2C1810" : "#BCA37F",
                  color: "#fff",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}>
                  {product.badge}
                </span>
              ) : null}

              {/* 2. Render Tags (e.g. handmade, spiritual) */}
              {Array.isArray(product.tags) && product.tags.map((tag: string) => {
                const displayTag = tag.startsWith('#') ? tag : `#${tag}`;
                return (
                  <span key={tag} className="product-badge" style={{
                    display: "inline-block",
                    padding: "0.3rem 0.8rem",
                    background: "#e8d8c3",
                    color: "#5a3e2b",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}>
                    {displayTag}
                  </span>
                );
              })}
            </div>

            {product.type !== "custom-order" && (
              <div
                style={{ pointerEvents: "auto" }}
                className="flex items-center gap-2 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/reviews/${product.id || product.slug}`);
                }}
              >
                <div className="flex items-center gap-2 text-[#5a3e2b]">
                  {ratingData.count === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 font-medium italic">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      No reviews yet
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-nowrap">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <span className="font-bold text-lg whitespace-nowrap flex items-center gap-1">
                        {ratingData.avg} <span className="text-gray-400 font-normal text-sm">({ratingData.count})</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Emotional Description */}
          <p style={{ fontSize: "1.1rem", lineHeight: 1.7, marginBottom: "1.5rem", color: "var(--text)" }}>
            {product.description}
          </p>

          {/* Made to Order Notice */}
          <div style={{
            padding: "1rem",
            background: "rgba(188, 163, 127, 0.1)",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            border: "1px solid rgba(188, 163, 127, 0.2)"
          }}>
            <strong style={{ display: "block", marginBottom: "0.3rem" }}>
              {product.type === "custom-order" ? "Custom Made for You" : "Made to Order"}
            </strong>
            <span className="meta" style={{ fontSize: "0.9rem" }}>
              {product.deliveryTime || "Dispatch in 3–5 business days."} {product.type === "custom-order" ? product.returnPolicy || "Non-refundable." : "Each piece is crafted especially for you."}
            </span>
            {product.shippingCharge !== undefined && (
              <div className="mt-2 text-sm text-stone-600 font-medium">
                Shipping: {product.shippingCharge === 0 ? "Free" : `₹${product.shippingCharge}`}
              </div>
            )}
          </div>

          {/* Trust Reassurance */}
          <div style={{
            padding: "0.8rem",
            background: "rgba(47, 42, 38, 0.05)",
            borderRadius: "8px",
            fontSize: "0.85rem",
            textAlign: "center"
          }}>
            <span className="meta">
              {product.type === "custom-order" ? "Secure payment via UPI/Bank Transfer" : "Secure payments via PayU"}
            </span>
          </div>

          {/* Read Reviews CTA */}
          {product.type !== "custom-order" && (
            <div className="flex justify-center mt-6">
              <button 
                id="reviews-anchor"
                onClick={() => router.push(`/reviews/${product.id || product.slug}`)}
                className="px-8 py-3 text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity border-0 cursor-pointer"
                style={{ backgroundColor: '#5a3e2b', color: '#ffffff', border: 'none' }}
              >
                {ratingData.count === 0 ? "Be the first to review →" : "Read all reviews →"}
              </button>
            </div>
          )}

          {/* Product Details */}
          <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Product Details</h3>
            <dl style={{ display: "grid", gap: "0.8rem" }}>
              {Array.isArray(product.materials) && product.materials.length > 0 && (
                <>
                  <dt style={{ fontWeight: 600, color: "var(--muted)" }}>Material:</dt>
                  <dd style={{ margin: 0 }}>{product.materials.join(", ")}</dd>
                </>
              )}
              {(selectedVariant?.dimensions || product.dimensions) && (
                <>
                  <dt style={{ fontWeight: 600, color: "var(--muted)" }}>Size / Dimensions:</dt>
                  <dd style={{ margin: 0 }}>{selectedVariant?.dimensions || product.dimensions}</dd>
                </>
              )}
              {(selectedVariant?.handcraftedHours || product.handcraftedHours) && (
                <>
                  <dt style={{ fontWeight: 600, color: "var(--muted)" }}>Handcrafted Hours:</dt>
                  <dd style={{ margin: 0 }}>{selectedVariant?.handcraftedHours || product.handcraftedHours} hours</dd>
                </>
              )}
              <dt style={{ fontWeight: 600, color: "var(--muted)" }}>Care Instructions:</dt>
              <dd style={{ margin: 0 }}>
                Hand wash gently with mild detergent. Lay flat to dry. Avoid direct sunlight to preserve colors.
              </dd>
            </dl>
          </div>

          {/* SEO Enriched Content - Collapsible */}
          {product.seoContent && (
            <SeoContentSection seoContent={product.seoContent} />
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: "4rem", paddingTop: "3rem", borderTop: "2px solid var(--border)" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 600, marginBottom: "1.5rem" }}>You May Also Like</h2>
          <div className="plp-grid">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.slug} p={prod} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
