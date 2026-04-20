"use client";

import { useState } from "react";
import Gallery from "@/components/Gallery";
import BuyBar from "@/components/BuyBar";
import VariantSelector from "@/components/VariantSelector";
import ProductCard from "@/components/ProductCardV2";
import Link from "next/link";
import type { Product, ProductVariant } from "@/types";
import { trackEvent } from "@/lib/analytics";
import { useWishlist } from "@/hooks/useWishlist";
import { useEffect } from "react";
import SeoContentSection from "@/components/SeoContentSection";

export default function ProductPageClient({
  product,
  relatedProducts
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const { toggleWishlist: toggleWishlistHook, isWishlisted } = useWishlist();

  const hearted = isWishlisted(product.id || product.slug);

  const onHeartClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      await toggleWishlistHook(product);
  };

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
              if ((window as any).showToast) {
                  (window as any).showToast("Link copied to clipboard! 📋");
              }
          }
      } catch (err) {
          console.error("Error sharing:", err);
      }
  };

  // Use variant images/price if variant selected, otherwise use product defaults
  const currentImages = selectedVariant?.images || product.images || ["/placeholder.png"];
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
            images={currentImages}
            alt={product.title}
            heartButton={
              <div className="product-page-actions" style={{ 
                position: "absolute", 
                top: "12px", 
                right: "12px", 
                display: "flex", 
                flexDirection: "row", 
                gap: "8px", 
                zIndex: 40 
              }}>
                <button
                  onClick={onHeartClick}
                  className={`product-page-heart product-page-heart-toggle ${hearted ? "is-active" : ""}`}
                  aria-label={hearted ? "Remove from wishlist" : "Add to wishlist"}
                  title={hearted ? "Remove from wishlist" : "Add to wishlist"}
                  type="button"
                  style={{ 
                    position: "static", 
                    background: "none", 
                    border: "none",
                    padding: 0,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill={hearted ? "#e63946" : "none"} stroke={hearted ? "#e63946" : "#4A3219"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </button>
                <button
                  onClick={onShareClick}
                  className="product-page-heart product-page-share"
                  aria-label="Share product"
                  title="Share product"
                  type="button"
                  style={{ 
                    position: "static", 
                    background: "none", 
                    border: "none",
                    padding: 0,
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width={20} height={20} viewBox="0 0 24 24" fill="#4A3219" stroke="#4A3219" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx={18} cy={5} r={3} fill="#4A3219"/><circle cx={6} cy={12} r={3} fill="#4A3219"/><circle cx={18} cy={19} r={3} fill="#4A3219"/><line x1={8.59} y1={13.51} x2={15.42} y2={17.49}/><line x1={15.41} y1={6.51} x2={8.59} y2={10.49}/>
                  </svg>
                </button>
              </div>
            }
          />
        </div>
        <div className="product-page-details">
          {/* Badge */}
          <div className="flex flex-wrap gap-2 mb-3">
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
          </div>

          <h1 style={{ marginTop: 0, fontSize: "2rem", lineHeight: 1.3, marginBottom: "1rem" }}>{product.title}</h1>

          {/* Price */}
          <div style={{ fontSize: "1.5rem", fontWeight: 700, margin: "1rem 0", color: "var(--brand)" }}>
            {product.type === "custom-order" ? (
              product.priceLabel || `Starts at ₹${product.minPrice || product.price}`
            ) : (
              `₹${currentPrice}`
            )}

            {(typeof currentStock === "number" && product.type !== "custom-order") && (
              <span className="meta" style={{ marginLeft: 12, fontSize: "0.9rem", fontWeight: 400 }}>
                {inStock ? `${currentStock} in stock` : "Out of stock"}
              </span>
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

          {/* Actions: BuyBar or Instagram Enquiry */}
          <div style={{ marginBottom: "1.5rem" }}>
            {product.type === "custom-order" ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const messageText = `Hi! Is "${product.title}" available? I'd love to place an order 🌸`;
                    // Copy message to clipboard so user can paste instantly
                    navigator.clipboard.writeText(messageText).catch(() => {});

                    // Instagram DM deep link — mobile opens app, desktop opens web DM
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    const url = isMobile
                      ? `https://ig.me/m/keshvi_crafts`
                      : `https://www.instagram.com/direct/new/?username=keshvi_crafts`;
                    window.open(url, "_blank", "noopener,noreferrer");

                    // Toast: tell user message is ready to paste
                    if (typeof window !== "undefined" && (window as any).showToast) {
                      (window as any).showToast(`Message copied! Just paste it in the DM 📋`);
                    }
                    trackEvent({
                      action: "click_instagram_enquiry",
                      category: "Ecommerce",
                      label: product.title,
                      location: "pdp_primary",
                      slug: product.slug
                    });
                  }}
                  className="btn-primary w-full text-lg"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                  Enquire on Instagram
                </button>

                <button
                  onClick={() => {
                    const message = product.cta?.prefillMessage || `Hi! I'm interested in ${product.title}`;
                    navigator.clipboard.writeText(message);
                    // Simple toast feedback
                    const btn = document.getElementById("copy-btn");
                    if (btn) {
                      const original = btn.innerText;
                      btn.innerText = "Copied! ✓";
                      setTimeout(() => btn.innerText = original, 2000);
                    }
                  }}
                  id="copy-btn"
                  className="btn-secondary w-full text-sm"
                >
                  Copy Enquiry Message
                </button>

                <p className="text-xs text-center text-stone-500 mt-2">
                  Since this is a custom piece, we take orders personally on Instagram to ensure perfect customization.
                </p>
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

          {/* Trust Reassurance */}
          <div style={{
            padding: "0.8rem",
            background: "rgba(47, 42, 38, 0.05)",
            borderRadius: "8px",
            fontSize: "0.85rem",
            textAlign: "center"
          }}>
            <span className="meta">
              {product.type === "custom-order" ? "Secure payment via UPI/Bank Transfer" : "Secure payments via Razorpay"}
            </span>
          </div>

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
