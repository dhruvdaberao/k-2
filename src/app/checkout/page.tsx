"use client";

import { supabase } from "@/lib/supabaseClient";

import { useEffect, useMemo, useState } from "react";
import products from "@/data/products.json";
import { useRouter } from "next/navigation";
import { clearCart, loadCart as getAsyncCart } from "@/lib/bags";
import { type CartItem } from "@/lib/bags";
import { calculateShipping } from "@/lib/shipping";
import CheckoutAddons from "@/components/CheckoutAddons";
import { showToast } from "@/components/Toast";
import {
  CheckoutCustomerDetails,
  CheckoutPaymentMethod,
  getPaymentMethodLabel,
} from "@/lib/checkout";
import { ORDER_CONFIRMATION_STORAGE_KEY, generateDynamicPdfUrl, generateLocalOrderId } from "@/lib/orderClient";
import { handlePlaceOrder as placeOrderInDB } from "@/lib/placeOrder";
import { getDirectCheckoutItem, clearDirectCheckoutItem } from "@/lib/directCheckout";
import type { Product } from "@/types";

import { useAuth } from "@/hooks/useAuth";

type CheckoutStep = "details" | "payment" | "summary";

const OWNER_PHONE_NUMBER = "7507996961";
const DETAILS_STORAGE_KEY = "checkout:details:v1";
const LEGACY_DETAILS_STORAGE_KEY = "customer_details";
const initialDetails: CheckoutCustomerDetails = {
  fullName: "",
  email: "",
  phoneNumber: "",
  address: "",
  city: "",
  pincode: "",
};

export default function CheckoutPage() {
    const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [addonItems, setAddonItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<CheckoutStep>("details");
  const [details, setDetails] = useState<CheckoutCustomerDetails>(initialDetails);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isDirectCheckout, setIsDirectCheckout] = useState(false);

  // Merge carts locally for calculation and order hooks
  const finalItems = useMemo(() => {
    return [...items, ...addonItems];
  }, [items, addonItems]);

  useEffect(() => {
    setHydrated(true);


    let hasInitialized = false;

    const restoreDetails = () => {
      // ... same logic
      if (profile) {
        setDetails({
          fullName: profile.name || "",
          email: user?.email || "",
          phoneNumber: profile.phone || "",
          address: profile.address || "",
          city: profile.city || "",
          pincode: profile.pincode || "",
        });
        return;
      }
      
      try {
        const saved = JSON.parse(localStorage.getItem(DETAILS_STORAGE_KEY) || localStorage.getItem(LEGACY_DETAILS_STORAGE_KEY) || "{}");
        setDetails({
          fullName: saved.fullName || saved.name || "",
          email: saved.email || saved.name || "",
          phoneNumber: saved.phoneNumber || saved.phone || "",
          address: saved.address || "",
          city: saved.city || "",
          pincode: saved.pincode || "",
        });
      } catch {
        setDetails(initialDetails);
      }
    };

    if (!hasInitialized) {
      hasInitialized = true;
      restoreDetails();
      refreshCart();
    }

    window.addEventListener("bag:changed", refreshCart);
    window.addEventListener("storage", refreshCart);

    return () => {
      window.removeEventListener("bag:changed", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, [router, step, profile, user]);

  const refreshCart = async () => {
    // Don't redirect during order placement — the cart will be empty by design
    if (isPlacingOrder) return;

    // Local explicit search param read to side-step app suspense bounds safely
    const isBuyNow = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("buyNow") === "true";

    // Check for direct checkout item first explicitly
    if (isBuyNow) {
      const directItem = getDirectCheckoutItem();
      if (directItem) {
        console.log("[Checkout] Using direct checkout item:", directItem);
        setIsDirectCheckout(true);
        setItems([{
          id: directItem.product_id,
          name: directItem.name,
          price: directItem.price,
          quantity: directItem.quantity,
          image: directItem.image,
        }]);
        return;
      }
    } else {
      // Clear direct checkout item so it doesn't pollute later
      clearDirectCheckoutItem();
      setIsDirectCheckout(false);
    }

    console.log("[Checkout] Refreshing cart data...");
    const currentCart = await getAsyncCart();
    if (currentCart.length === 0) {
      console.warn("[Checkout] Cart is empty, redirecting...");
      showToast("Your cart is empty.");
      router.replace("/cart");
      return;
    }
    console.log("[Checkout] Items loaded:", currentCart);
    setItems(currentCart);
  };

  const handleAddonAdded = (product: Product) => {
    const addonItem: CartItem = {
      id: product.id || product.slug || "",
      name: product.title,
      price: product.price,
      quantity: 1,
      image: (product as any).image || (product as any).img || (product as any).image_url || product.images?.[0] || "/placeholder.png"
    };
    setAddonItems(prev => {
      if (prev.some(it => it.id === addonItem.id)) return prev;
      return [...prev, addonItem];
    });
    showToast(`Added ${product.title}`);
  };

  const enrichedItems = useMemo(() => {
    return finalItems.map((item) => {
      const product = resolveProduct(item);
      return {
        ...item,
        product,
        shippingCharge: product?.shippingCharge,
        checkoutUrl: product?.checkoutUrl,
      };
    });
  }, [finalItems]);

  const subtotal = enrichedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Discount logic (synced with cart)
  const discountableSubtotal = enrichedItems.reduce((s, it) => {
    if (it.product?.type === "custom-order") return s;
    return s + it.price * it.quantity;
  }, 0);

  let discountPercent = 0;
  if (discountableSubtotal >= 1800) discountPercent = 20;
  else if (discountableSubtotal >= 1250) discountPercent = 10;

  const discountAmount = Math.round((discountableSubtotal * discountPercent) / 100);

  // Shipping logic (synced with cart)
  const baseShipping = 40;
  const isFreeShipping = subtotal >= 650;
  const shippingDiscount = isFreeShipping ? -baseShipping : 0;
  const shippingCharge = isFreeShipping ? 0 : baseShipping;

  const total = subtotal + baseShipping + shippingDiscount - discountAmount;

  const orderItems = useMemo(
    () =>
      enrichedItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        lineTotal: item.price * item.quantity,
      })),
    [enrichedItems]
  );

  const onlinePaymentLinks = enrichedItems.filter((item) => item.checkoutUrl);

  const handleFieldChange = (field: keyof CheckoutCustomerDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const handleDetailsNext = () => {
    if (!details.fullName || !details.email || !details.phoneNumber || !details.address || !details.city || !details.pincode) {
      showToast("Please complete all required details.");
      return;
    }

    localStorage.setItem(DETAILS_STORAGE_KEY, JSON.stringify(details));
    localStorage.setItem(
      LEGACY_DETAILS_STORAGE_KEY,
      JSON.stringify({
        name: details.fullName,
        email: details.email,
        phone: details.phoneNumber,
        address: details.address,
        city: details.city,
        pincode: details.pincode,
      })
    );

    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentNext = () => {
    if (paymentMethod === "online") {
      showToast("Online payment is not available currently.");
      return;
    }
    setStep("summary");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onPlaceOrder = async () => {
    if (isPlacingOrder) return;
    
    if (finalItems.length === 0) {
      showToast("Your cart is empty.");
      router.replace("/cart");
      return;
    }

    if (!profile?.name || !user?.email || !profile?.phone) {
      showToast("Please complete your profile before placing order");
      router.push("/profile?edit=true");
      return;
    }

    try {
      console.log("Placing order...");
      setIsPlacingOrder(true);

      const {
        data: { session }
      } = await supabase.auth.getSession();

      const authUser = session?.user;

      console.log("FIXED USER:", authUser);

      if (!authUser) {
        showToast("Session not ready, retrying...");
        setIsPlacingOrder(false);
        return;
      }

      const mappedFinalItems = finalItems.map(item => ({
        product_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image || ""
      }));
      
      const result = await placeOrderInDB(mappedFinalItems);
      console.log("Order result:", result);

      if (!result.success) {
        console.error("[Checkout] DB order failed:", result.error);
        showToast(result.error || "Order failed");
        setIsPlacingOrder(false);
        return; // finally block will reset isPlacingOrder, but user explicitly wants it reset here too
      }

      window.dispatchEvent(new CustomEvent("bag:changed"));
      setItems([]);
      setAddonItems([]);

      const orderId = result.displayId || result.orderId || generateLocalOrderId();
      const createdAt = new Date().toISOString();

      const orderData = {
        o: orderId,
        c: createdAt,
        s: subtotal,
        d: discountAmount,
        sh: baseShipping,
        sd: shippingDiscount,
        dp: discountPercent,
        t: total,
        pm: paymentMethod,
        h: (typeof window !== "undefined" ? window.location.origin : ""),
        u: {
          n: details.fullName,
          e: details.email,
          p: details.phoneNumber,
          a: details.address,
          c: details.city,
          z: details.pincode,
        },
        i: enrichedItems.map((item) => ({
          n: item.name,
          p: item.price,
          q: item.quantity,
          m: item.image || "",
        })),
      };

      const dynamicPdfUrl = generateDynamicPdfUrl(orderData);

      localStorage.setItem(
        ORDER_CONFIRMATION_STORAGE_KEY,
        JSON.stringify({
          order_id: orderId,
          pdf_url: dynamicPdfUrl,
          payment_method: paymentMethod,
          total: total,
          created_at: createdAt,
        })
      );

      // Navigate FIRST — before clearing cart to prevent empty cart flash
      router.push(`/order-success?orderId=${orderId}`);

      // Clear cart in background AFTER navigation starts
      clearCart();
      clearDirectCheckoutItem();

      // Fire-and-forget email (don't block navigation)
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order_placed",
          userEmail: details.email,
          orderId: orderId,
          items: finalItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
          total: total
        })
      }).catch(emailErr => {
        console.error("Order Email Error (Non-blocking):", emailErr);
      });
    } catch (err) {
      console.error("ORDER ERROR:", err);
      showToast("Something went wrong. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!hydrated) {
    return <main className="checkout-page checkout-container checkout-flow py-10" />;
  }

  if (finalItems.length === 0 && !isPlacingOrder) {
    return (
      <main className="checkout-page checkout-container checkout-flow py-10 text-center">
        <h1 className="checkout-title">Checkout</h1>
        <p className="checkout-note">Redirecting to your cart...</p>
      </main>
    );
  }

  return (
    <main className="checkout-page checkout-container checkout-flow">
      <meta name="robots" content="noindex" />

      {/* Full-page processing overlay */}
      {isPlacingOrder && (
        <div style={{ position: 'fixed', inset: 0, background: '#FAF8F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999, gap: 16 }}>
          <div style={{ width: 44, height: 44, border: '4px solid #e6ded4', borderTop: '4px solid #5a3e2b', borderRadius: '50%', animation: 'co-spin 0.8s linear infinite' }} />
          <p style={{ color: '#5a3e2b', fontSize: 16, fontWeight: 600, fontFamily: 'Georgia, serif' }}>Processing your order...</p>
          <p style={{ color: '#8B7355', fontSize: 13 }}>Please wait, do not close this page</p>
          <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <div className="checkout-header">
        <h1 className="checkout-title">
          {step === "details" && "Your Details"}
          {step === "payment" && "Select Payment Method"}
          {step === "summary" && "Order Summary"}
        </h1>
        <p className="checkout-note">
          A clean, guided checkout for your handmade order.
        </p>
      </div>

      <div className="checkout-stepper" aria-label="Checkout progress">
        {[
          { key: "details", label: "Your Details", number: "1" },
          { key: "payment", label: "Payment", number: "2" },
          { key: "summary", label: "Summary", number: "3" },
        ].map((stepItem, index) => {
          const currentIndex = ["details", "payment", "summary"].indexOf(step);
          const itemIndex = ["details", "payment", "summary"].indexOf(stepItem.key);
          const isActive = stepItem.key === step;
          const isComplete = currentIndex > itemIndex;

          return (
            <div className="checkout-stepper__item" key={stepItem.key}>
              <div className={`checkout-stepper__dot ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`}>
                {isComplete ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : stepItem.number}
              </div>
              <span className={`checkout-stepper__label ${isActive ? "is-active" : ""} ${!isActive ? "checkout-stepper__label--hidden-mobile" : "fw-bold"}`}>{stepItem.label}</span>
              {index < 2 && <div className="checkout-stepper__line" aria-hidden="true" />}
            </div>
          );
        })}
      </div>

      {/* Item summary strip - Properly Spaced Pattern */}
      {enrichedItems.length > 0 && (
        <div className="checkout-item-summary-strip">
          <div className="checkout-item-summary-strip__inner">
            {enrichedItems.map((item, i) => (
              <div className="checkout-item-summary-row" key={`thumb-${item.id}-${i}`}>
                <div className="checkout-item-summary-thumb">
                  <img src={item.image || "/placeholder.png"} alt={item.name} />
                </div>
                <div className="checkout-item-summary-content">
                  <p className="checkout-item-summary-name">{item.name.split(" - ")[0]}</p>
                  <p className="checkout-item-summary-meta">Qty {item.quantity} · ₹{item.price * item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="checkout-shell">
        {step === "details" && (
          <section className="checkout-details-summary">
            <div className="summary-data-grid">
              <div className="summary-item">
                <span className="summary-label">Full Name</span>
                <span className="summary-value">{details.fullName || "Not provided"}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Phone Number</span>
                <span className="summary-value">{details.phoneNumber || "Not provided"}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Email</span>
                <span className="summary-value">{details.email || user?.email || "Not provided"}</span>
              </div>
              <div className="summary-item summary-item--full">
                <span className="summary-label">Delivery Address</span>
                <span className="summary-value">{details.address || "Not provided"}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">City</span>
                <span className="summary-value">{details.city || "Not provided"}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Pincode</span>
                <span className="summary-value">{details.pincode || "Not provided"}</span>
              </div>
            </div>

            <div className="summary-edit-footer">
              <button 
                type="button" 
                className="btn-secondary text-sm px-4 py-2" 
                onClick={() => router.push("/profile?edit=true")}
                style={{ height: 'auto', borderRadius: '8px' }}
              >
                Edit Details
              </button>
            </div>

            <div className="checkout-actions mt-10">
              <button type="button" className="btn-primary checkout-button w-full" onClick={handleDetailsNext}>
                Proceed to Payment {"\u2192"}
              </button>
            </div>
            {!details.fullName || !details.address || !details.phoneNumber || !details.pincode ? (
              <p className="text-[11px] text-red-500 mt-3 text-center font-medium">Please click Edit to complete your delivery information.</p>
            ) : null}
          </section>
        )}

        {step === "payment" && (
          <section className="checkout-card checkout-section">
            <div className="checkout-payment-grid">
              <button
                type="button"
                className={`checkout-payment-card ${paymentMethod === "cod" ? "is-selected" : ""}`}
                onClick={() => setPaymentMethod("cod")}
              >
                <span className="checkout-payment-card__radio" aria-hidden="true" />
                <span className="checkout-payment-card__title">COD</span>
                <span className="checkout-payment-card__copy">Cash on Delivery</span>
              </button>

              <button
                type="button"
                className={`checkout-payment-card ${paymentMethod === "online" ? "is-selected" : ""}`}
                onClick={() => setPaymentMethod("online")}
              >
                <span className="checkout-payment-card__radio" aria-hidden="true" />
                <span className="checkout-payment-card__title">Online Payment</span>
                <span className="checkout-payment-card__copy">UPI / Card</span>
                {paymentMethod === "online" && (
                  <span className="text-[10px] font-bold text-red-600 mt-1 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    Currently Unavailable
                  </span>
                )}
              </button>
            </div>

            <div className="checkout-actions checkout-actions--between">
              <button type="button" className="btn-secondary checkout-button checkout-button--ghost" onClick={() => setStep("details")}>
                &larr; Back
              </button>
              <button type="button" className="btn-primary checkout-button" onClick={handlePaymentNext}>
                Next Step &rarr;
              </button>
            </div>
          </section>
        )}

        {step === "summary" && (
          <section className="checkout-card checkout-card--summary checkout-section order-summary">
            <div className="checkout-summary-list checkout-items">
              {enrichedItems.map((it) => (
                <div className="flex justify-between items-start" key={it.id}>
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="font-bold text-[#2f2a26] truncate">{it.name.split(" - ")[0]}</p>
                    <p className="text-xs text-[#6a6150]">Qty {it.quantity} × ₹{it.price}</p>
                  </div>
                  <span className="font-bold text-[#2f2a26] flex-shrink-0">₹{it.price * it.quantity}</span>
                </div>
              ))}
            </div>

            <div className="checkout-summary-panel">
              <div className="checkout-summary-panel__row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="checkout-summary-panel__row">
                <span>Shipping Fee</span>
                <span>{formatCurrency(baseShipping)}</span>
              </div>
              {shippingDiscount < 0 && (
                <div className="checkout-summary-panel__row text-[#0F766E] font-medium">
                  <span>Shipping Discount</span>
                  <span>-₹{Math.abs(shippingDiscount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="checkout-summary-panel__row text-[#C2410C] font-medium">
                  <span>Order Discount ({discountPercent}%)</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}
              
              <div className="h-px bg-[#e5e7eb] mt-10 mb-6" />

              <div className="checkout-summary-panel__row">
                <span>Payment</span>
                <span>{getPaymentMethodLabel(paymentMethod)}</span>
              </div>
              <div className="checkout-summary-panel__row checkout-summary-panel__row--total">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {paymentMethod === "online" && (
              <div className="checkout-inline-note">
                {onlinePaymentLinks.length > 0
                  ? "Online payment links are still available below if you want to complete payment right away."
                  : "Online payment has been selected. We will continue the payment handoff via Instagram after placing the order."}
              </div>
            )}

            {paymentMethod === "online" && onlinePaymentLinks.length > 0 && (
              <div className="checkout-link-list">
                {onlinePaymentLinks.map((item) => (
                  <a
                    key={`${item.id}-payment`}
                    href={item.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary checkout-link-button"
                  >
                    Pay for {item.name}
                  </a>
                ))}
              </div>
            )}

            <CheckoutAddons currentCartSlugs={finalItems.map((item) => item.id)} onAdded={handleAddonAdded} />

            <div className="checkout-actions checkout-actions--between">
              <button type="button" className="btn-secondary checkout-button checkout-button--ghost" onClick={() => setStep("payment")}>
                &larr; Back
              </button>
              <button
                type="button"
                className="btn-primary checkout-button"
                onClick={onPlaceOrder}
                disabled={isPlacingOrder}
                aria-busy={isPlacingOrder}
                style={isPlacingOrder ? { pointerEvents: "none", opacity: 0.7 } : undefined}
              >
                {isPlacingOrder ? "Processing…" : "Confirm & Place Order"}
              </button>
            </div>
            <p className="checkout-note" style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#666", lineHeight: "1.4" }}>
              Note: An invoice and full summary will be generated securely on the next page.
            </p>
          </section>
        )}

      </div>
    </main>
  );
}

function resolveProduct(item: CartItem): Product | undefined {
  const exact = (products as Product[]).find((product) => product.slug === item.id);
  if (exact) return exact;

  return (products as Product[]).find((product) => item.id && item.id.startsWith(`${product.slug}-`));
}

function formatCurrency(amount: number) {
  return amount === 0 ? "Free" : `\u20B9${amount}`;
}
