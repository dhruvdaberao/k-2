"use client";

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
import { supabase } from "@/lib/supabaseClient";
import type { Product } from "@/types";

// type definition removed, imported from bags
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
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [step, setStep] = useState<CheckoutStep>("details");
  const [details, setDetails] = useState<CheckoutCustomerDetails>(initialDetails);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod>("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast("Please login/signup to continue checkout");
        router.replace("/profile");
      }
    };
    checkAuth();

    const restoreDetails = () => {
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

    restoreDetails();
    refreshCart();

    window.addEventListener("bag:changed", refreshCart);
    window.addEventListener("storage", refreshCart);

    return () => {
      window.removeEventListener("bag:changed", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, [router, step]);

  const refreshCart = async () => {
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

  const enrichedItems = useMemo(() => {
    return items.map((item) => {
      const product = resolveProduct(item);
      return {
        ...item,
        product,
        shippingCharge: product?.shippingCharge,
        checkoutUrl: product?.checkoutUrl,
      };
    });
  }, [items]);

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

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      showToast("Your cart is empty.");
      router.replace("/cart");
      return;
    }

    try {
      setIsPlacingOrder(true);
      
      const orderId = generateLocalOrderId();
      const createdAt = new Date().toISOString();

      // Prepare stateless order data
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
      const isCod = paymentMethod === "cod";
      const docType = isCod ? "invoice" : "order_details";
      const invoiceUrl = `${dynamicPdfUrl}&t=${docType}`;
      
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

      await clearCart();
      const linkLabel = isCod ? "Invoice" : "Order Details";
      const instaText = `Hi, my order is placed (ID: ${orderId}). ${linkLabel}: ${invoiceUrl}`;
      const instaUrl = `https://ig.me/m/keshvi_crafts`;
      
      // Copy to clipboard since Instagram doesn't support pre-filled text in URL
      try {
        await navigator.clipboard.writeText(instaText);
        showToast("Order link copied! Please paste it in Instagram.");
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }

      // Try to open Instagram DM in a new tab
      const instaWindow = window.open(instaUrl, "_blank", "noopener,noreferrer");
      if (!instaWindow) {
        console.warn("Instagram popup was blocked.");
      }

      router.push("/order-confirmed");
    } catch (error) {
      console.error("Order process error:", error);
      showToast("Something went wrong. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!hydrated) {
    return <main className="checkout-page checkout-container checkout-flow py-10" />;
  }

  if (items.length === 0) {
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
              <span className={`checkout-stepper__label ${isActive ? "is-active" : ""} ${!isActive ? "checkout-stepper__label--hidden-mobile" : ""}`}>{stepItem.label}</span>
              {index < 2 && <div className="checkout-stepper__line" aria-hidden="true" />}
            </div>
          );
        })}
      </div>

      {/* Item summary strip */}
      {enrichedItems.length > 0 && (
        <div className="checkout-item-thumbs">
          {enrichedItems.map((item, i) => (
            <div className="checkout-item-thumb-row" key={`thumb-${item.id}-${i}`}>
              <img
                src={item.image || "/placeholder.png"}
                alt={item.name}
                className="checkout-item-thumb"
              />
              <div className="checkout-item-thumb-info">
                <p className="checkout-item-thumb-name">{item.name.split(" - ")[0]}</p>
                <p className="checkout-item-thumb-qty">Qty {item.quantity}{item.name.includes(" - ") ? ` · ${item.name.split(" - ")[1]}` : ""}</p>
              </div>
              <span className="checkout-item-thumb-price">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      )}

      <div className="checkout-shell">
        {step === "details" && (
          <section className="checkout-card checkout-section">
            <div className="checkout-form-grid">
              <label className="checkout-field">
                <span>Full Name</span>
                <input
                  type="text"
                  value={details.fullName}
                  onChange={(event) => handleFieldChange("fullName", event.target.value)}
                  placeholder="Name Surname"
                />
              </label>

              <label className="checkout-field">
                <span>Email Address</span>
                <input
                  type="email"
                  value={details.email}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  placeholder="name@example.com"
                />
              </label>

              <label className="checkout-field">
                <span>Phone Number</span>
                <input
                  type="tel"
                  value={details.phoneNumber}
                  onChange={(event) => handleFieldChange("phoneNumber", event.target.value)}
                  placeholder="+91 1234567890"
                />
              </label>

              <label className="checkout-field checkout-field--full">
                <span>Address</span>
                <textarea
                  rows={4}
                  value={details.address}
                  onChange={(event) => handleFieldChange("address", event.target.value)}
                  placeholder="House number, street, landmark"
                />
              </label>

              <label className="checkout-field">
                <span>City</span>
                <input
                  type="text"
                  value={details.city}
                  onChange={(event) => handleFieldChange("city", event.target.value)}
                  placeholder="Bikini Bottom"
                />
              </label>

              <label className="checkout-field">
                <span>Pincode</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={details.pincode}
                  onChange={(event) => handleFieldChange("pincode", event.target.value)}
                  placeholder="123456"
                />
              </label>
            </div>

            <div className="checkout-actions">
              <button type="button" className="btn-primary checkout-button" onClick={handleDetailsNext}>
                Next {"\u2192"}
              </button>
            </div>
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
                Back
              </button>
              <button type="button" className="btn-primary checkout-button" onClick={handlePaymentNext}>
                Next {"\u2192"}
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

            <CheckoutAddons currentCartSlugs={items.map((item) => item.id)} onAdded={refreshCart} />

            <div className="checkout-actions checkout-actions--between">
              <button type="button" className="btn-secondary checkout-button checkout-button--ghost" onClick={() => setStep("payment")}>
                Back
              </button>
              <button type="button" className="btn-primary checkout-button" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                {isPlacingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </div>
            <p className="checkout-note" style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#666", lineHeight: "1.4" }}>
              Note: On clicking "Place Order", you will be redirected to Instagram. 
              <b> The order link will be copied to your clipboard</b>—please paste it in the chat to ensure your order is confirmed. 
              After sending, please return to this page to download your professional Invoice / Order Details.
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

  return (products as Product[]).find((product) => item.id.startsWith(`${product.slug}-`));
}

function formatCurrency(amount: number) {
  return amount === 0 ? "Free" : `\u20B9${amount}`;
}
