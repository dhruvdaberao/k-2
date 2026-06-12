"use client";

import { useState, useEffect, useCallback } from "react";
import Gallery from "@/components/Gallery";
import BuyBar from "@/components/BuyBar";
import VariantSelector from "@/components/VariantSelector";
import ProductCard from "@/components/ProductCardV2";
import Link from "next/link";
import StickyBuyBar from "@/components/StickyBuyBar";
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
  const [showStickyBar, setShowStickyBar] = useState(false);

  // Intersection Observer for Sticky Buy Bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the main buy bar is completely out of view (above the viewport)
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          setShowStickyBar(true);
        } else {
          setShowStickyBar(false);
        }
      },
      { threshold: 0 }
    );

    const mainBuyBar = document.getElementById("product-main-buy");
    if (mainBuyBar) observer.observe(mainBuyBar);

    return () => {
      if (mainBuyBar) observer.unobserve(mainBuyBar);
    };
  }, []);

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
      <div className="md:hidden flex items-center mb-3 px-1">
          <button 
            onClick={() => router.back()} 
            className="global-back-btn flex items-center gap-2"
            style={{ background: 'transparent', border: 'none', outline: 'none', padding: '0', cursor: 'pointer', color: '#5a3e2b' }}
            title="Go Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            <span style={{ fontSize: '16px', fontWeight: 600 }}>Go Back</span>
          </button>
      </div>
      <div className="product-page-grid">
        <div className="product-page-media product-image-container relative">
          {product.discount_badge && (
            <div 
              className="absolute text-white font-bold z-10 shadow-sm uppercase rounded-full"
              style={{
                top: "20px",
                left: "16px",
                fontSize: "13px",
                padding: "4px 8px",
                backgroundColor: "#C84C35"
              }}
            >
              {product.discount_badge}
            </div>
          )}
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
                    viewBox="0 0 24 24" 
                    fill={isHearted ? "#C84C35" : "rgba(0,0,0,0.15)"}
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    stroke={isHearted ? "#C84C35" : "white"}
                    className={`pdp-action-icon transition-transform duration-200 ${isPopping ? 'animate-heart-pop' : ''} hover:scale-110 active:scale-90 drop-shadow-md`}
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
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pdp-action-icon drop-shadow-md">
                    <circle cx={18} cy={5} r={3} fill="white" /><circle cx={6} cy={12} r={3} fill="white" /><circle cx={18} cy={19} r={3} fill="white" /><line x1={8.59} y1={13.51} x2={15.42} y2={17.49}/><line x1={15.41} y1={6.51} x2={8.59} y2={10.49}/>
                  </svg>
                </button>
              </div>
            }
          />
        </div>
        <div className="product-page-details">
          <div className="flex items-center gap-3 mb-4 lg:mt-3">
            <h1 className="product-title font-bold text-neutral-900" style={{ marginTop: 0, fontSize: "2rem", lineHeight: 1.3, marginBottom: 0 }}>{product.title}</h1>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 md:gap-4 my-4 md:my-6">
            <div className="pdp-price-text font-bold text-[var(--brand)]">
              {product.type === "custom-order" ? (
                product.priceLabel || `Starts at ₹${product.minPrice || product.price}`
              ) : (
                `₹${currentPrice}`
              )}
            </div>

            {product.original_price && product.type !== "custom-order" && (
              <div className="pdp-price-strike font-semibold line-through text-gray-400">
                ₹{product.original_price}
              </div>
            )}

            {(typeof currentStock === "number" && product.type !== "custom-order") && (
              <span 
                className={`pdp-badge-text align-middle ml-auto ${inStock ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`} 
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
          <div id="product-main-buy" style={{ marginBottom: "1.5rem", scrollMarginTop: "120px" }}>
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
                  className="btn-primary w-full text-lg md:text-2xl py-3 md:py-4 font-bold rounded-xl"
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
              {/* 0. Discount Badge */}
              {product.discount_badge && (
                <span className="pdp-badge-text" style={{
                  background: "#C84C35",
                  color: "#fff",
                  textTransform: "uppercase"
                }}>
                  {product.discount_badge}
                </span>
              )}

              {/* 1. Render Badges (e.g. Bestseller) */}
              {Array.isArray(product.badges) && product.badges.length > 0 ? (
                product.badges.map((b: string) => (
                  <span key={b} className="pdp-badge-text" style={{
                    background: b === "Bestseller" ? "#2C1810" : "#BCA37F",
                    color: "#fff",
                  }}>
                    {b}
                  </span>
                ))
              ) : product.badge ? (
                <span className="pdp-badge-text" style={{
                  background: product.badge === "Bestseller" ? "#2C1810" : "#BCA37F",
                  color: "#fff",
                }}>
                  {product.badge}
                </span>
              ) : null}

              {/* 2. Render Tags (e.g. handmade, spiritual) */}
              {Array.isArray(product.tags) && product.tags.filter((t: string) => !t.startsWith('_')).map((tag: string) => {
                const displayTag = tag.startsWith('#') ? tag : `#${tag}`;
                return (
                  <span key={tag} className="pdp-tag-text" style={{
                    background: "#e8d8c3",
                    color: "#5a3e2b",
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
                    <div className="flex items-center gap-2 text-gray-400 font-medium italic pdp-rating-text">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pdp-rating-icon shrink-0">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      No reviews yet
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-nowrap">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pdp-rating-icon shrink-0">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      <span className="pdp-rating-text font-bold whitespace-nowrap flex items-center gap-1">
                        {ratingData.avg} <span className="text-gray-400 font-normal">({ratingData.count})</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Emotional Description */}
          <p className="pdp-desc-text mb-6 text-[var(--text)] whitespace-pre-wrap">
            {product.description}
          </p>

          {/* Made to Order Notice */}
          <div className="p-4 md:p-6 mb-6 rounded-xl border border-[rgba(188,163,127,0.2)] bg-[rgba(188,163,127,0.1)]">
            <strong className="pdp-box-title block mb-2 text-[#4A3219]">
              {product.type === "custom-order" ? "Custom Made for You" : "Made to Order"}
            </strong>
            <span className="pdp-box-text block text-stone-700">
              {product.deliveryTime || "Dispatch in 7-10 business days."} {product.type === "custom-order" ? product.returnPolicy || "Non-refundable." : "Each piece is crafted especially for you."}
            </span>
            {product.shippingCharge !== undefined && (
              <div className="pdp-box-text mt-2 text-stone-600 font-medium">
                Shipping: {product.shippingCharge === 0 ? "Free" : `₹${product.shippingCharge}`}
              </div>
            )}
          </div>

          {/* Trust Reassurance */}
          <div className="p-3 md:p-5 mb-6 rounded-xl bg-[rgba(47,42,38,0.05)] text-center pdp-box-text text-stone-600 font-medium">
            <span>
              {product.type === "custom-order" ? "Secure payment via UPI/Bank Transfer" : "Secure payments via PayU"}
            </span>
          </div>

          {/* Read Reviews CTA */}
          {product.type !== "custom-order" && (
            <div className="flex flex-col md:flex-row justify-center items-center mt-6 md:mt-10 gap-4">
              <button 
                onClick={() => router.push(`/reviews/${product.id || product.slug}?mode=write`)}
                className="btn-secondary px-8 py-3 md:px-12 md:py-4 rounded-full text-sm md:text-lg lg:text-xl font-bold cursor-pointer border-2 border-[#5a3e2b] text-[#5a3e2b] bg-transparent w-[90%] md:w-auto md:min-w-[280px] hover:bg-[#5a3e2b] hover:text-white transition-colors"
              >
                Write a Review
              </button>
              <button 
                id="reviews-anchor"
                onClick={() => router.push(`/reviews/${product.id || product.slug}`)}
                className="btn-primary px-8 py-3 md:px-12 md:py-4 rounded-full text-sm md:text-lg lg:text-xl font-bold cursor-pointer border-0 w-[90%] md:w-auto md:min-w-[280px] text-white hover:opacity-90 transition-opacity"
                style={{ background: 'var(--brand)' }}
              >
                {ratingData.count === 0 ? "Be the first to review →" : "Read all reviews →"}
              </button>
            </div>
          )}

          {/* Product Details */}
          <div className="mt-8 pt-8 md:mt-12 md:pt-12 border-t border-[var(--border)]">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 md:mb-6 text-[#4A3219]">Product Details</h3>
            <dl className="grid gap-3 md:gap-5 text-base md:text-xl lg:text-2xl">
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
        <section className="mt-16 pt-12 border-t-2 border-[var(--border)] mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-center text-[#4A3219]">You May Also Like</h2>
          <div className="plp-grid-mobile">
            {relatedProducts.map((prod) => (
              <ProductCard key={prod.slug} p={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky Buy Bar for Mobile/Desktop conversions */}
      {product.type !== "custom-order" && (
        <StickyBuyBar 
          slug={currentSlug}
          title={currentTitle}
          price={currentPrice}
          image={currentImages[0]}
          disabled={!inStock}
          isVisible={showStickyBar}
        />
      )}
    </>
  );
}
