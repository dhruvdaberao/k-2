// app/orders/page.tsx
"use client";

import { supabase } from "@/lib/supabaseClient";

import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────
type OrderStatus = "placed" | "confirmed" | "shipped" | "delivered" | "cancelled";

type Order = {
  id: string;
  display_id?: string;
  created_at: string;
  total_amount: number;
  status: OrderStatus;
};

// ─── Status badge config ───────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  placed:    { label: "Placed",    bg: "#EDE8E0", text: "#7C6F5F" },
  confirmed: { label: "Confirmed", bg: "#E0ECFA", text: "#3B6CB5" },
  shipped:   { label: "Shipped",   bg: "#FDF0E1", text: "#B5651D" },
  delivered: { label: "Delivered", bg: "#E3F2E8", text: "#3D7A4F" },
  cancelled: { label: "Cancelled", bg: "#F5E1E1", text: "#A33B3B" },
};

/** Format ISO date string to readable format like "20 Apr 2026" */
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

/** Shorten a UUID to first 8 characters for display */
function shortenId(id: string): string {
  return id.length > 8 ? id.slice(0, 8).toUpperCase() : id;
}

import { useRouter } from "next/navigation";

// ─── Component ─────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let timeoutId: any;

    const loadData = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, display_id, created_at, total_amount, status")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (active) {
          if (!error) setOrders(data || []);
          setLoading(false);
        }
      } catch (err) {
        if (active) setLoading(false);
      }
    };

    // 1. Initial attempt
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id && active) {
        loadData(session.user.id);
      }
    });

    // 2. Auth listener (important for client-side navigation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.id && active && loading) {
        loadData(session.user.id);
      } else if (!session && event === 'SIGNED_OUT' && active) {
        setOrders([]);
        setLoading(false);
      }
    });

    // 3. Safety timeout (if no session found in 3s, stop showing skeleton)
    timeoutId = setTimeout(() => {
      if (active && loading) {
        console.warn("[Orders] Loading timed out");
        setLoading(false);
      }
    }, 3000);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [supabase]);

  // Refined loading state: show the basic page structure instead of a full-screen skeleton flash
  const loadingView = (
    <div className="orders-list">
      {[1, 2, 3].map(i => (
        <div key={i} className="order-card animate-pulse opacity-40">
          <div className="order-card__body">
            <div className="order-card__info gap-2">
               <div className="h-4 w-24 bg-stone-200 rounded" />
               <div className="h-3 w-32 bg-stone-200 rounded mt-2" />
            </div>
            <div className="h-6 w-20 bg-stone-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="orders-page">
      <style dangerouslySetInnerHTML={{ __html: ordersCSS }} />

      <div className="orders-container">
        {/* ── Page Header ─────────────────────────────── */}
        <header className="orders-header">
          <h1 className="orders-title">Your Orders</h1>
          <p className="orders-subtitle">
            {orders.length > 0
              ? `${orders.length} order${orders.length > 1 ? "s" : ""} placed`
              : "Track and manage your orders"}
          </p>
        </header>

        {loading ? (
          loadingView
        ) : orders.length === 0 ? (
          /* ── Empty State (matches Wishlist empty state) ── */
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 max-w-md mx-auto">
            <div className="mb-6 opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 100" fill="none" stroke="#4A3219" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {/* Top face */}
                <path d="M50 10 L92 32 L50 54 L8 32 Z" />
                {/* Left face */}
                <path d="M8 32 L50 54 L50 88 L8 66 Z" />
                {/* Right face */}
                <path d="M92 32 L50 54 L50 88 L92 66 Z" />
                {/* Tape/seam lines across top face */}
                <line x1="61" y1="16" x2="19" y2="38" />
                <line x1="75" y1="23" x2="33" y2="45" />
                {/* Label lines on left face */}
                <line x1="16" y1="56" x2="30" y2="48" />
                <line x1="16" y1="62" x2="26" y2="56" />
              </svg>
            </div>
            <h2 className="text-xl font-serif font-bold text-[#2f2a26] mb-2">No orders yet</h2>
            <p className="text-stone-500 mb-8 text-sm italic">
              Start shopping to place your first order.
            </p>
            <Link href="/collections" className="btn-primary px-10 py-3 rounded-full font-bold">
              Browse Products
            </Link>
          </div>
        ) : (
          /* ── Order Cards ──────────────────────────── */
          <div className="orders-list">
            {orders.map((order) => {
              const status = (order.status || "placed") as OrderStatus;
              const badge = STATUS_CONFIG[status] || STATUS_CONFIG.placed;
              return (
                <Link href={`/orders/${order.display_id || order.id}`} key={order.display_id || order.id} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="order-card">
                    <div className="order-card__body">
                      {/* Left side */}
                      <div className="order-card__info">
                        <span className="order-card__id">{order.display_id || shortenId(order.id)}</span>
                        <span className="order-card__date">{formatDate(order.created_at)}</span>
                        <span className="order-card__total">₹{(order.total_amount || 0).toLocaleString("en-IN")}</span>
                      </div>

                      {/* Right side */}
                      <div className="order-card__actions">
                        <span
                          className="order-badge"
                          style={{ background: badge.bg, color: badge.text }}
                        >
                          {badge.label}
                        </span>
                        <svg className="order-card__chevron" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

// ─── Scoped CSS ────────────────────────────────────────────────────────────
const ordersCSS = `
  .orders-page {
    min-height: 100vh;
    background: var(--bg, #FDFBF7);
    padding-bottom: 80px;
  }

  .orders-container {
    max-width: 680px;
    margin: 0 auto;
    padding: 0 16px;
  }

  /* ── Header ────────────────────────────────── */
  .orders-header {
    padding: 40px 0 24px;
  }

  .orders-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--brand, #4A3219);
    margin: 0 0 4px;
    letter-spacing: -0.3px;
  }

  .orders-subtitle {
    font-size: 14px;
    color: var(--muted, #737373);
    margin: 0;
    font-weight: 400;
  }

  /* ── Empty State ───────────────────────────── */
  .orders-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 55vh;
    padding: 40px 24px;
  }

  .orders-empty__icon {
    color: var(--brand, #4A3219);
    opacity: 0.22;
    margin-bottom: 24px;
  }

  .orders-empty__title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text, #1A1A1A);
    margin: 0 0 8px;
  }

  .orders-empty__text {
    font-size: 14px;
    color: var(--muted, #737373);
    margin: 0 0 32px;
    font-style: italic;
  }

  .orders-empty__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 36px;
    background: var(--brand, #4A3219);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    border-radius: 12px;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(74, 50, 25, 0.18);
  }

  .orders-empty__btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(74, 50, 25, 0.28);
    background: #3B2814;
  }

  /* ── Order Cards ───────────────────────────── */
  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .order-card {
    background: #F5EFE6;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(74, 50, 25, 0.05);
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1),
                border-color 0.25s ease;
    border: 1px solid #E6DCCF;
  }

  .order-card:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 4px 14px rgba(74, 50, 25, 0.1), 0 8px 24px rgba(74, 50, 25, 0.06);
    border-color: #D4C4B0;
  }

  .order-card:active {
    transform: translateY(-1px) scale(1.005);
  }

  .order-card__body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  /* Left info stack */
  .order-card__info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .order-card__id {
    font-size: 13px;
    font-weight: 600;
    color: #5A3E2B;
    letter-spacing: 0.2px;
  }

  .order-card__date {
    font-size: 12px;
    color: #8B7355;
    font-weight: 400;
  }

  .order-card__total {
    font-size: 18px;
    font-weight: 700;
    color: #3E2C1C;
    margin-top: 4px;
  }

  .order-card__items {
    font-size: 12px;
    color: #8B7355;
    font-weight: 400;
  }

  /* Right actions */
  .order-card__actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
    flex-shrink: 0;
  }

  .order-card__chevron {
    color: #C9B99A;
    transition: transform 0.2s ease, color 0.2s ease;
  }

  .order-card:hover .order-card__chevron {
    transform: translateX(3px);
    color: #5A3E2B;
  }

  /* ── Status Badge ──────────────────────────── */
  .order-badge {
    display: inline-flex;
    align-items: center;
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
    white-space: nowrap;
    line-height: 1;
  }

  /* ── Responsive ────────────────────────────── */
  @media (min-width: 768px) {
    .orders-header {
      padding: 56px 0 32px;
    }

    .orders-title {
      font-size: 36px;
    }

    .orders-subtitle {
      font-size: 15px;
    }

    .order-card {
      padding: 24px 28px;
    }

    .order-card__id {
      font-size: 14px;
    }

    .order-card__total {
      font-size: 20px;
    }

    .orders-list {
      gap: 16px;
    }
  }

  @media (max-width: 380px) {
    .orders-container {
      padding: 0 12px;
    }

    .order-card {
      padding: 16px;
      border-radius: 16px;
    }

    .order-card__total {
      font-size: 16px;
    }

    .order-badge {
      font-size: 11px;
      padding: 4px 10px;
    }
  }
`;
