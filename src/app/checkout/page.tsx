"use client";

import { supabase } from "@/lib/supabaseClient";
import GlobalLoader from "@/components/ui/GlobalLoader";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import products from "@/data/products.json";
import { useRouter, useSearchParams } from "next/navigation";
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

type CheckoutStep = 1 | 2 | 3; // 1: details, 2: payment, 3: summary

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
  state: "",
  country: "",
};



function CheckoutContent() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get("guest") === "true";
  
  const [items, setItems] = useState<CartItem[]>([]);
  const [addonItems, setAddonItems] = useState<CartItem[]>([]);
  const hasInitialized = useRef(false);
  
  const [step, setStep] = useState<CheckoutStep>(1);
  const [details, setDetails] = useState<CheckoutCustomerDetails>(initialDetails);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("cod");
  
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [isDirectCheckout, setIsDirectCheckout] = useState(false);
  const [isGuestLocked, setIsGuestLocked] = useState(false);

  const refreshCart = useCallback(async () => {
    if (isPlacingOrder || isOrderPlaced) return;

    const isBuyNow = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("buyNow") === "true";

    if (isBuyNow) {
      const directItem = getDirectCheckoutItem();
      if (directItem) {
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
      clearDirectCheckoutItem();
      setIsDirectCheckout(false);
    }

    const currentCart = await getAsyncCart();
    setItems(currentCart);
  }, [isPlacingOrder, isOrderPlaced]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    setHydrated(true);
    refreshCart();

    const restoreDetails = () => {
      try {
        const stored = localStorage.getItem(DETAILS_STORAGE_KEY) || localStorage.getItem(LEGACY_DETAILS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDetails(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error("Failed to restore details", e);
      }
    };
    restoreDetails();

    window.addEventListener("bag:changed", refreshCart);
    window.addEventListener("storage", refreshCart);
    return () => {
      window.removeEventListener("bag:changed", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, [refreshCart]);

  useEffect(() => {
    if (user && profile && !isGuestLocked) {
      setDetails(prev => ({
        ...prev,
        fullName: profile.name || prev.fullName,
        email: user.email || prev.email,
        phoneNumber: profile.phone || prev.phoneNumber,
        address: profile.address || prev.address,
        city: profile.city || prev.city,
        pincode: profile.pincode || prev.pincode,
        state: profile.state || prev.state,
        country: profile.country || prev.country
      }));
    }
  }, [user, profile, isGuestLocked]);

  const finalItems = useMemo(() => [...items, ...addonItems], [items, addonItems]);
  
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

  const subtotal = useMemo(() => enrichedItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [enrichedItems]);

  const discountableSubtotal = useMemo(() => enrichedItems.reduce((s, it) => {
    if (it.product?.type === "custom-order") return s;
    return s + it.price * it.quantity;
  }, 0), [enrichedItems]);

  const discountPercent = useMemo(() => {
    if (discountableSubtotal >= 1800) return 20;
    if (discountableSubtotal >= 1250) return 10;
    return 0;
  }, [discountableSubtotal]);

  const discountAmount = Math.round((discountableSubtotal * discountPercent) / 100);

  const baseShipping = 40;
  const isFreeShipping = subtotal >= 650;
  const shippingDiscount = isFreeShipping ? -baseShipping : 0;
  const total = subtotal + baseShipping + shippingDiscount - discountAmount;

  const onlinePaymentLinks = enrichedItems.filter((item) => item.checkoutUrl);

  const handleFieldChange = (field: keyof CheckoutCustomerDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
  };

  const handleDetailsNext = () => {
    if (!details.fullName || !details.email || !details.phoneNumber || !details.address || !details.city || !details.pincode || !details.state || !details.country) {
      showToast("Please fill all the details from the profile to continue");
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
        state: details.state,
        country: details.country,
      })
    );

    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentNext = () => {
    if (paymentMethod === "online") {
      showToast("Online payment is not available currently.");
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGuestDetailsToggle = () => {
    if (!isGuestLocked) {
      if (!details.fullName || !details.email || !details.phoneNumber || !details.address || !details.city || !details.pincode || !details.state || !details.country) {
        showToast("Please fill all the fields to continue");
        return;
      }
      setIsGuestLocked(true);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast("Details saved!");
    } else {
      setIsGuestLocked(false);
    }
  };

  function handleAddonAdded(product: Product) {
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
  }

  const onPlaceOrder = async () => {
    if (isPlacingOrder) return;

    console.log("🚀 Placing order started");

    if (finalItems.length === 0) {
      showToast("Your cart is empty.");
      return;
    }

    if (isGuest && !isGuestLocked) {
      showToast("Please complete and save your details first.");
      return;
    }

    if (!isGuest && (!profile?.name || !user?.email || !profile?.phone)) {
      showToast("Please complete your profile before placing order");
      router.push("/profile?edit=true");
      return;
    }

    try {
      setIsPlacingOrder(true);

      const {
        data: { user: authUser },
        error: authError
      } = await supabase.auth.getUser();

      if (authError && !isGuest) {
        console.error("[Checkout] Auth check failed:", authError);
        showToast("Session expired. Please login again.");
        setIsPlacingOrder(false);
        return;
      }

      if (!authUser && !isGuest) {
        showToast("Please login to place your order.");
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

      console.log("📦 Creating order in DB...");
      const result = await placeOrderInDB(mappedFinalItems, details);
      console.log("✅ Order result:", result);

      if (!result.success) {
        console.error("[Checkout] DB order failed:", result.error);
        showToast(result.error || "Order failed");
        setIsPlacingOrder(false);
        return;
      }

      window.dispatchEvent(new CustomEvent("bag:changed"));

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
          st: details.state,
          co: details.country,
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

      // Fire-and-forget email
      const emailPayload = {
        type: "order_placed",
        email: details.email || user?.email || "",
        orderId: orderId,
        items: finalItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        total: total,
        subtotal: subtotal,
        shipping: baseShipping + shippingDiscount,
        discount: discountAmount,
        paymentMethod: paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        invoiceUrl: dynamicPdfUrl,
        customerName: details.fullName || profile?.name || "Customer"
      };

      console.log("📧 Sending order email...", emailPayload.email);
      fetch("/api/send-email", { // Use the new consistent API
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailPayload)
      }).catch(e => console.error("Email error:", e));

      // Mark order as placed to prevent empty-cart flicker/redirect
      setIsOrderPlaced(true);

      // ── REDIRECT TO SUCCESS PAGE ──
      console.log("🏁 Redirecting to success page...");

      // Clear cart before moving
      clearCart();
      clearDirectCheckoutItem();

      const successUrl = `/order-success?orderId=${orderId}${result.accessToken ? `&token=${result.accessToken}` : ""}`;
      router.push(successUrl);
    } catch (err) {
      console.error("❌ Critical Order error:", err);
      showToast("Failed to place order. Please try again.");
      setIsPlacingOrder(false);
    }
  };

  // ── STEP 1: Full-page loader blocks EVERYTHING during order processing ──
  if (isPlacingOrder) {
    return <GlobalLoader message="Processing your order..." />;
  }

  // ── Success Screen is now handled by redirecting to /order-success ──

  if (!hydrated) {
    return <main className="checkout-page checkout-container checkout-flow py-10" />;
  }

  // PREVENT REDIRECTS: If cart is empty, show a friendly local UI instead of redirecting.
  // Exception: If we just placed an order, don't show the empty cart screen (allow redirect to success page)
  if (finalItems.length === 0 && !isOrderPlaced) {
    return (
      <main className="checkout-page checkout-container checkout-flow py-20 text-center">
        <div className="mb-6 opacity-30">
          <svg style={{ margin: '0 auto' }} xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.56-7.43H5.12" />
          </svg>
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#2f2a26] mb-3">Your cart is empty</h2>
        <p className="text-stone-500 mb-10 text-sm italic">You don't have any items to checkout.</p>
        <button onClick={() => router.push('/collections')} className="btn btn-primary px-10 py-3 rounded-full font-bold shadow-sm">
          Browse Collections
        </button>
      </main>
    );
  }

  return (
    <main className="checkout-page checkout-container checkout-flow">
      <meta name="robots" content="noindex" />

      <div className="checkout-header">
        <h1 className="checkout-title">
          {step === 1 && "Your Details"}
          {step === 2 && "Select Payment Method"}
          {step === 3 && "Order Summary"}
        </h1>
        <p className="checkout-note">
          A clean, guided checkout for your handmade order.
        </p>
      </div>

      <div className="checkout-stepper" aria-label="Checkout progress">
        {[
          { key: 1, label: "Your Details", number: "1" },
          { key: 2, label: "Payment", number: "2" },
          { key: 3, label: "Summary", number: "3" },
        ].map((stepItem, index) => {
          const isActive = stepItem.key === step;
          const isComplete = step > stepItem.key;

          return (
            <div className="checkout-stepper__item" key={stepItem.key}>
              <div className={`checkout-stepper__dot ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`}>
                {isComplete ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
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
        {step === 1 && (
          isGuest ? (
            <section className="checkout-card checkout-section">
              <div className="checkout-form-grid">
                <label className="checkout-field">
                  <span>Full Name</span>
                  <input
                    type="text"
                    value={details.fullName}
                    onChange={(e) => handleFieldChange("fullName", e.target.value)}
                    placeholder="Your Name"
                    disabled={isGuestLocked}
                    className="w-full border p-2 rounded"
                    style={isGuestLocked ? { opacity: 0.7 } : undefined}
                  />
                </label>

                <label className="checkout-field">
                  <span>Email Address</span>
                  <input
                    type="email"
                    value={details.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    placeholder="name@example.com"
                    disabled={isGuestLocked}
                    className="w-full border p-2 rounded"
                    style={isGuestLocked ? { opacity: 0.7 } : undefined}
                  />
                </label>

                <label className="checkout-field">
                  <span>Phone Number</span>
                  <input
                    type="tel"
                    value={details.phoneNumber}
                    onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                    placeholder="+91 1234567890"
                    disabled={isGuestLocked}
                    className="w-full border p-2 rounded"
                    style={isGuestLocked ? { opacity: 0.7 } : undefined}
                  />
                </label>

                <label className="checkout-field checkout-field--full">
                  <span>Delivery Address</span>
                  <textarea
                    rows={3}
                    value={details.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    placeholder="House, street, landmark"
                    disabled={isGuestLocked}
                    className="w-full border p-2 rounded"
                    style={isGuestLocked ? { opacity: 0.7 } : undefined}
                  />
                </label>

                <label className="checkout-field">
                  <span>City</span>
                  <input
                    type="text"
                    value={details.city}
                    onChange={(e) => handleFieldChange("city", e.target.value)}
                    placeholder="Bikini Bottom"
                    disabled={isGuestLocked}
                    className="w-full border p-2 rounded"
                    style={isGuestLocked ? { opacity: 0.7 } : undefined}
                  />
                </label>


                <label className="checkout-field">
                  <span>Pincode</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={details.pincode}
                    onChange={(e) => handleFieldChange("pincode", e.target.value)}
                    placeholder="123456"
                    disabled={isGuestLocked}
                    className="w-full border p-2 rounded"
                    style={isGuestLocked ? { opacity: 0.7 } : undefined}
                  />
                </label>

                <label className="checkout-field">
                  <span>State</span>
                  <input
                    type="text"
                    value={details.state}
                    onChange={(e) => handleFieldChange("state", e.target.value)}
                    placeholder="State"
                    disabled={isGuestLocked}
                    className="w-full border p-2 rounded"
                    style={isGuestLocked ? { opacity: 0.7 } : undefined}
                  />
                </label>

                <label className="checkout-field">
                  <span>Country</span>
                  <input
                    type="text"
                    value={details.country}
                    onChange={(e) => handleFieldChange("country", e.target.value)}
                    placeholder="Country"
                    disabled={isGuestLocked}
                    className="w-full border p-2 rounded"
                    style={isGuestLocked ? { opacity: 0.7 } : undefined}
                  />
                </label>
              </div>

              <div className="checkout-actions mt-10 flex flex-col gap-3">
                <button
                  type="button"
                  className="btn-primary checkout-button w-full"
                  onClick={handleGuestDetailsToggle}
                >
                  {isGuestLocked ? "Edit Details" : "Save & Continue to Payment"}
                </button>

                {isGuestLocked && (
                  <button type="button" className="btn-primary checkout-button w-full" onClick={handleDetailsNext} style={{ background: 'transparent', color: 'var(--brand)', border: '2px solid var(--brand)' }}>
                    Proceed to Payment {"\u2192"}
                  </button>
                )}
              </div>
            </section>
          ) : (
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
                <div className="summary-item">
                  <span className="summary-label">State</span>
                  <span className="summary-value">{details.state || "Not provided"}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Country</span>
                  <span className="summary-value">{details.country || "Not provided"}</span>
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
              {!details.fullName || !details.address || !details.phoneNumber || !details.pincode || !details.state || !details.country ? (
                <p className="text-[11px] text-red-500 mt-3 text-center font-medium">Please click Edit to complete your delivery information.</p>
              ) : null}
            </section>
          )
        )}

        {step === 2 && (
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    Currently Unavailable
                  </span>
                )}
              </button>
            </div>

            <div className="checkout-actions checkout-actions--between">
              <button type="button" className="btn-secondary checkout-button checkout-button--ghost" onClick={() => setStep(1)}>
                &larr; Back
              </button>
              <button type="button" className="btn-primary checkout-button" onClick={handlePaymentNext}>
                Next Step &rarr;
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
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
              <button type="button" className="btn-secondary checkout-button checkout-button--ghost" onClick={() => setStep(2)}>
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

export default function CheckoutPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <CheckoutContent />
    </Suspense>
  );
}
