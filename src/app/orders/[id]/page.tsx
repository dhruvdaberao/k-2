// app/orders/[id]/page.tsx
"use client";

import { supabase } from "@/lib/supabaseClient";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { showToast } from "@/components/Toast";
import ConfirmModal from "@/components/ui/ConfirmModal";

// ─── Types ─────────────────────────────────────────────────────────────────
type OrderStatus = "placed" | "confirmed" | "shipped" | "delivered" | "cancelled";

type DeliveryAddress = {
  full_name?: string;
  phone?: string;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
};

type OrderRow = {
  id: string;
  display_id?: string;
  created_at: string;
  updated_at?: string;
  cancelled_at?: string;
  total_amount: number;
  status: OrderStatus;
  payment_method: string;
  payment_status: string;
  address: string;
  delivery_address?: DeliveryAddress | null;
};

type OrderItem = {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

// ─── Status badge config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  placed:    { label: "Placed",    bg: "#EDE8E0", text: "#7C6F5F" },
  confirmed: { label: "Confirmed", bg: "#E0ECFA", text: "#3B6CB5" },
  shipped:   { label: "Shipped",   bg: "#FDF0E1", text: "#B5651D" },
  delivered: { label: "Delivered", bg: "#E3F2E8", text: "#3D7A4F" },
  cancelled: { label: "Cancelled", bg: "#F5E1E1", text: "#A33B3B" },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function shortenId(id: string): string {
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id;
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
    const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string>("#");


  useEffect(() => {
    if (!order) return;

    const orderId = order.display_id || order.id;
    const invoiceUrl = `${window.location.origin}/api/invoice?orderId=${orderId}`;
    setInvoiceUrl(invoiceUrl);
  }, [order]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        // Fetch order intelligently by display_id or fallback UUID based on pattern
        const isDisplayId = orderId.startsWith("KC-");
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq(isDisplayId ? "display_id" : "id", orderId)
          .eq("user_id", user.id)
          .single();

        if (orderError || !orderData) {
          console.error("[OrderDetail] Order fetch error:", orderError?.message);
          setNotFound(true);
          setLoading(false);
          return;
        }

        setOrder(orderData);

        // Fetch items mapping to the explicit inner UUID safely
        const { data: itemsData, error: itemsError } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderData.id);

        if (itemsError) {
          console.error("[OrderDetail] Items fetch error:", itemsError.message);
        } else {
          setItems(itemsData || []);
        }
      } catch (err) {
        console.error("[OrderDetail] Unexpected error:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  // ── Cancel order handler ───────────────────────────────────────────────
  const handleCancelClick = () => {
    if (!order) return;
    const orderTime = new Date(order.created_at);
    const now = new Date();
    const diffHours = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);

    if (diffHours > 12) {
      setCancelError(true);
    } else {
      setShowCancelModal(true);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || cancelling) return;
    setCancelling(true);

    try {
      // Try updating by UUID id first
      const cancelledAt = new Date().toISOString();
      let updateResult = await supabase
        .from("orders")
        .update({ status: "cancelled", cancelled_at: cancelledAt })
        .eq("id", order.id)
        .select();

      console.log("[OrderDetail] Cancel update result (by id):", updateResult);

      // If no rows matched by UUID, try by display_id
      if (!updateResult.data || updateResult.data.length === 0) {
        console.log("[OrderDetail] Fallback: trying cancel by display_id...");
        updateResult = await supabase
          .from("orders")
          .update({ status: "cancelled", cancelled_at: cancelledAt })
          .eq("display_id", order.display_id || order.id)
          .select();
        console.log("[OrderDetail] Cancel update result (by display_id):", updateResult);
      }

      if (updateResult.error) {
        console.error("[OrderDetail] Cancel error:", updateResult.error.message);
        showToast("Failed to cancel order. Please try again.");
      } else if (!updateResult.data || updateResult.data.length === 0) {
        console.error("[OrderDetail] Cancel: no rows updated. Possible RLS issue.");
        showToast("Unable to cancel — please contact support.");
      } else {
        // Successfully cancelled — update local state 
        setOrder({ ...order, status: "cancelled", cancelled_at: cancelledAt });
        showToast("Order cancelled successfully.");
        router.refresh();

        // ── Trigger Cancellation Email (Non-Blocking) ──
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "order_cancelled",
              userEmail: user.email,
              orderId: order.display_id || order.id,
              items: items,
              total: order.total_amount
            })
          }).catch(emailErr => {
            console.error("[OrderDetail] Non-fatal: cancel email failed", emailErr);
          });
        }
      }
    } catch (err) {
      console.error("[OrderDetail] Cancel unexpected error:", err);
      showToast("Something went wrong.");
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  // ── WhatsApp help link ─────────────────────────────────────────────────
  const whatsappLink = order
    ? `https://wa.me/917507996961?text=${encodeURIComponent(
        `Hi, I need help with order ${order.display_id || shortenId(order.id)}. Order placed on ${formatDate(order.created_at)}.`
      )}`
    : "#";

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="od-page">
        <style dangerouslySetInnerHTML={{ __html: detailCSS }} />
        <div className="od-container">
          <div className="od-header">
            <h1 className="od-title">Order Details</h1>
            <p className="od-subtitle">Loading order...</p>
          </div>
        </div>
      </main>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────
  if (notFound || !order) {
    return (
      <main className="od-page">
        <style dangerouslySetInnerHTML={{ __html: detailCSS }} />
        <div className="od-container">
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 max-w-md mx-auto">
            <h2 className="text-xl font-serif font-bold text-[#2f2a26] mb-2">Order not found</h2>
            <p className="text-stone-500 mb-8 text-sm italic">
              This order doesn't exist or you don't have access to it.
            </p>
            <Link href="/orders" className="btn-primary px-10 py-3 rounded-full font-bold">
              Back to Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────
  const status = (order.status || "placed") as OrderStatus;
  const badge = STATUS_CONFIG[status] || STATUS_CONFIG.placed;

  return (
    <main className="od-page">
      <style dangerouslySetInnerHTML={{ __html: detailCSS }} />

      <div className="od-container">
        {/* ── Header ──────────────────────────────────── */}
        <header className="od-header">
          <Link href="/orders" className="od-back">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Orders
          </Link>
          <h1 className="od-title">Order Details</h1>
        </header>

        {/* ── Order Summary Card ──────────────────────── */}
        <div className="od-card">
          <div className="od-card__row">
            <div>
              <span className="od-label">Order ID</span>
              <span className="od-value od-value--id">{order.display_id || shortenId(order.id)}</span>
            </div>
            <span className="od-badge" style={{ background: badge.bg, color: badge.text }}>
              {badge.label}
            </span>
          </div>
          <div className="od-card__row">
            <div>
              <span className="od-label">Date</span>
              <span className="od-value">{formatDate(order.created_at)}</span>
            </div>
            <div className="text-right">
              <span className="od-label">Total</span>
              <span className="od-value od-value--total">₹{(order.total_amount || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* ── Cancelled Banner ──────────────────────────── */}
        {status === "cancelled" && (
          <div style={{ background: '#F5E1E1', border: '1px solid #E8B4B4', borderRadius: 14, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A33B3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: '#A33B3B', fontSize: 14 }}>Order Cancelled</p>
              {order.cancelled_at && (
                <p style={{ margin: 0, color: '#A33B3B', fontSize: 12, opacity: 0.8 }}>
                  Cancelled on {formatDate(order.cancelled_at)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Payment Info ────────────────────────────── */}
        <div className="od-card">
          <h3 className="od-section-title">Payment</h3>
          <div className="od-card__row">
            <div>
              <span className="od-label">Method</span>
              <span className="od-value">{order.payment_method || "COD"}</span>
            </div>
            <div className="text-right">
              <span className="od-label">Status</span>
              <span className="od-value" style={{ textTransform: "capitalize" }}>
                {order.payment_status || "pending"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Delivery Address ────────────────────────── */}
        {(order.delivery_address || order.address) && (
          <div className="od-card">
            <h3 className="od-section-title">Delivery Address</h3>
            {order.delivery_address ? (
              <div className="od-address">
                {order.delivery_address.full_name && (
                  <p style={{ fontWeight: 600, marginBottom: 2 }}>{order.delivery_address.full_name}</p>
                )}
                {order.delivery_address.address_line && (
                  <p>{order.delivery_address.address_line}</p>
                )}
                <p>
                  {[order.delivery_address.city, order.delivery_address.state].filter(Boolean).join(", ")}
                  {order.delivery_address.pincode ? ` - ${order.delivery_address.pincode}` : ""}
                </p>
                {order.delivery_address.phone && (
                  <p style={{ marginTop: 4 }}>Phone: {order.delivery_address.phone}</p>
                )}
              </div>
            ) : (
              <p className="od-address">{order.address}</p>
            )}
          </div>
        )}

        {/* ── Items List ─────────────────────────────── */}
        <div className="od-card">
          <h3 className="od-section-title">
            Items ({items.length})
          </h3>
          <div className="od-items">
            {items.map((item) => (
              <div className="od-item" key={item.id}>
                <div className="od-item__img">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={64}
                      height={64}
                      style={{ objectFit: "cover", borderRadius: "12px" }}
                    />
                  ) : (
                    <div className="od-item__placeholder" />
                  )}
                </div>
                <div className="od-item__info">
                  <span className="od-item__name">{item.name}</span>
                  <span className="od-item__meta">
                    ₹{item.price.toLocaleString("en-IN")} × {item.quantity}
                  </span>
                </div>
                <span className="od-item__total">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>

          {/* Total summary */}
          <div className="od-total-row">
            <span>Total Amount</span>
            <span className="od-total-amount">₹{(order.total_amount || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* ── Action Buttons ──────────────────────────── */}
        <div className="od-actions">
          {status === "placed" && (
            <button
              className="od-btn od-btn--cancel"
              onClick={handleCancelClick}
              disabled={cancelling}
            >
              Cancel Order
            </button>
          )}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="od-btn od-btn--help"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Need Help?
          </a>
          {status !== "cancelled" ? (
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="od-btn od-btn--download"
            >
              <span>Download Invoice</span>
            </a>
          ) : (
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="od-btn od-btn--secondary"
              style={{ opacity: 0.7 }}
            >
              <span>View Cancelled Invoice</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Cancel Confirmation Modal ────────────────── */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Cancel Order"
        message="Are you sure you want to cancel this order?"
        confirmLabel={cancelling ? "Cancelling..." : "Confirm"}
        cancelLabel="Cancel"
        destructive
        onConfirm={handleCancelOrder}
        onCancel={() => setShowCancelModal(false)}
      />

      {/* ── Cannot Cancel Modal ────────────────── */}
      <ConfirmModal
        isOpen={cancelError}
        title="Cannot Cancel Order"
        message="Orders can only be cancelled within 12 hours of placement."
        confirmLabel="Okay"
        cancelLabel="Close"
        onConfirm={() => setCancelError(false)}
        onCancel={() => setCancelError(false)}
      />
    </main>
  );
}

// ─── Scoped CSS ────────────────────────────────────────────────────────────
const detailCSS = `
  .od-page {
    min-height: 100vh;
    background: var(--bg, #FDFBF7);
    padding-bottom: 100px;
  }

  .od-container {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 16px;
  }

  /* ── Header ─────────────────────────────── */
  .od-header {
    padding: 24px 0 20px;
  }

  .od-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #8B7355;
    text-decoration: none;
    margin-bottom: 12px;
    transition: color 0.2s;
  }

  .od-back:hover {
    color: #5A3E2B;
  }

  .od-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--brand, #4A3219);
    margin: 0;
    letter-spacing: -0.3px;
  }

  .od-subtitle {
    font-size: 14px;
    color: #8B7355;
    margin: 4px 0 0;
  }

  /* ── Cards ──────────────────────────────── */
  .od-card {
    background: #F5EFE6;
    border-radius: 20px;
    padding: 20px;
    border: 1px solid #E6DCCF;
    margin-bottom: 14px;
  }

  .od-section-title {
    font-size: 14px;
    font-weight: 700;
    color: #5A3E2B;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: 0 0 14px;
  }

  .od-card__row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .od-card__row + .od-card__row {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #E6DCCF;
  }

  .od-label {
    display: block;
    font-size: 11px;
    font-weight: 500;
    color: #8B7355;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 2px;
  }

  .od-value {
    display: block;
    font-size: 15px;
    font-weight: 500;
    color: #3E2C1C;
  }

  .od-value--id {
    font-weight: 700;
    font-size: 16px;
    letter-spacing: 0.3px;
  }

  .od-value--total {
    font-weight: 700;
    font-size: 18px;
  }

  .text-right {
    text-align: right;
  }

  /* ── Badge ──────────────────────────────── */
  .od-badge {
    display: inline-flex;
    align-items: center;
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
    line-height: 1;
    flex-shrink: 0;
  }

  /* ── Address ────────────────────────────── */
  .od-address {
    font-size: 14px;
    color: #3E2C1C;
    line-height: 1.6;
    margin: 0;
  }

  /* ── Items ──────────────────────────────── */
  .od-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .od-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 14px;
    border: 1px solid #EDE5D8;
  }

  .od-item__img {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
    background: #EDE5D8;
  }

  .od-item__img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .od-item__placeholder {
    width: 100%;
    height: 100%;
    background: #DDD4C6;
    border-radius: 12px;
  }

  .od-item__info {
    flex: 1;
    min-width: 0;
  }

  .od-item__name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #3E2C1C;
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .od-item__meta {
    font-size: 12px;
    color: #8B7355;
  }

  .od-item__total {
    font-size: 15px;
    font-weight: 700;
    color: #3E2C1C;
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* ── Total Row ─────────────────────────── */
  .od-total-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 2px solid #D4C4B0;
    font-size: 14px;
    font-weight: 600;
    color: #5A3E2B;
  }

  .od-total-amount {
    font-size: 20px;
    font-weight: 700;
    color: #3E2C1C;
  }

  /* ── Action Buttons ────────────────────── */
  .od-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }

  .od-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    flex: 1;
  }

  a.od-btn--download,
  a.od-btn--download:visited,
  a.od-btn--download:hover,
  a.od-btn--download span {
    color: #ffffff !important;
    background-color: #5a3e2b;
    border-radius: 0.75rem;
  }

  a.od-btn--download:hover {
    background-color: #4a3222;
  }

  .od-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .od-btn--cancel {
    background: transparent;
    color: #A33B3B;
    border: 1.5px solid #A33B3B;
  }

  .od-btn--cancel:not(:disabled):hover {
    background: #A33B3B;
    color: #fff;
  }

  .od-btn--help {
    background: #F5EFE6;
    color: #5A3E2B;
    border: 1.5px solid #E6DCCF;
  }

  .od-btn--help:hover {
    background: #EDE5D8;
    border-color: #D4C4B0;
  }

  .od-btn--secondary {
    background: #F5EFE6;
    color: #5A3E2B;
    border: 1.5px solid #E6DCCF;
  }

  .od-btn--secondary:hover {
    background: #EDE5D8;
  }

    .od-btn--secondary:hover {
      background: #EDE5D8;
    }

  /* ── Responsive ────────────────────────── */
  @media (min-width: 768px) {
    .od-header { padding: 40px 0 28px; }
    .od-title { font-size: 36px; }
    .od-card { padding: 24px 28px; }
    .od-item__img { width: 72px; height: 72px; }
  }

  @media (max-width: 380px) {
    .od-container { padding: 0 12px; }
    .od-card { padding: 16px; border-radius: 16px; }
    .od-item { padding: 10px; gap: 10px; }
    .od-item__img { width: 52px; height: 52px; }
    .od-actions { flex-direction: column; }
  }
`;
