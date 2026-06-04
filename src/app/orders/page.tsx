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
  shipping_charge?: number | null;
  status: OrderStatus;
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  placed:    { label: "Placed",    bg: "#FFF4CC", text: "#B58B00" },
  confirmed: { label: "Confirmed", bg: "#E0ECFA", text: "#3B6CB5" },
  shipped:   { label: "Shipped",   bg: "#E3F2FD", text: "#1565C0" },
  delivered: { label: "Delivered", bg: "#E8F5E9", text: "#2E7D32" },
  cancelled: { label: "Cancelled", bg: "#FDECEA", text: "#C62828" },
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
import { useAuth } from "@/hooks/useAuth";
import { useRef } from "react";
import OrderSkeleton from "@/components/ui/OrderSkeleton";

// ─── Component ─────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const isInitialLoad = useRef(true);
  const hasFetched = useRef(false);

  // Phase 1: Instantly show cached orders on mount (before auth resolves)
  useEffect(() => {
    // Try to load ANY cached orders immediately for instant display
    try {
      const allKeys = Object.keys(localStorage);
      const cacheKey = allKeys.find(k => k.startsWith("orders_cache_"));
      if (cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
            setLoading(false);
          }
        }
      }
    } catch {}
  }, []);

  // Phase 2: Fetch fresh data once auth resolves
  useEffect(() => {
    if (authLoading) return;
    if (hasFetched.current) return;

    const init = async () => {
      try {
        if (!user) {
          console.warn("⚠️ [ORDERS] No session found");
          setLoading(false);
          isInitialLoad.current = false;
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("No token");

        const cacheKey = `orders_cache_${user.id}`;
        if (isInitialLoad.current) {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            setOrders(JSON.parse(cached));
            setLoading(false);
          }
        }

        hasFetched.current = true;
        const res = await fetch(`/api/user/orders?t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: "no-store"
        });
        const result = await res.json();

        if (!result.success) {
          console.error("❌ [ORDERS] Fetch error:", result.error);
          setFetchError(true);
        } else {
          setOrders(result.orders || []);
          localStorage.setItem(cacheKey, JSON.stringify(result.orders || []));
        }
      } catch (err) {
        console.error("🔥 [ORDERS] Crash:", err);
        setFetchError(true);
      } finally {
        setLoading(false);
        isInitialLoad.current = false;
      }
    };

    init();
  }, [user, authLoading]);

  // Rich skeleton that mirrors real order card structure with shimmer
  const loadingView = <OrderSkeleton type="list" />;

  return (
    <main className="orders-page">
      <style dangerouslySetInnerHTML={{ __html: ordersCSS }} />

      <div className="orders-container">
        {/* ── Page Header ─────────────────────────────── */}
        <header className="orders-header flex flex-col items-center relative">
          <div className="flex items-center justify-between w-full relative mb-2">
            <button
              onClick={() => router.push("/profile")}
              className="global-back-btn"
              style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#5a3e2b', zIndex: 10, marginLeft: '-8px' }}
              aria-label="Go Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <h1 className="collections-title" style={{ margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
              Your Orders
            </h1>
            <div style={{ width: '40px' }}></div>
          </div>
          <p className="orders-subtitle text-center mt-1 w-full" style={{ color: '#6b7280' }}>
            {orders.length > 0
              ? `${orders.length} order${orders.length > 1 ? "s" : ""} placed`
              : "Track and manage your orders"}
          </p>
        </header>

        {loading ? (
          loadingView
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 max-w-md mx-auto">
            <h2 className="text-xl font-serif font-bold text-[#4A3219] mb-2">Something went wrong</h2>
            <p className="text-[#8B7355] mb-8 text-sm italic">
              We couldn't load your orders. Please try again.
            </p>
            <button onClick={() => window.location.reload()} className="btn-primary px-10 py-3 rounded-full font-bold">
              Reload Page
            </button>
          </div>
        ) : orders.length === 0 ? (
          /* ── Empty State (matches Wishlist empty state) ── */
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 max-w-md mx-auto">
            <div className="mb-6 opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '120px', height: '120px', margin: '0 auto' }}>
                <rect x="2" y="8" width="20" height="14" rx="2" ry="2" fill="none"></rect>
                <path d="M7 11V6a5 5 0 0 1 10 0v5" fill="none"></path>
              </svg>
            </div>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-serif font-bold text-[#2f2a26] mb-2 md:mb-4">No orders yet</h2>
            <p className="text-stone-500 mb-8 text-sm md:text-lg lg:text-xl italic">
              Start shopping to place your first order.
            </p>
            <Link href="/collections" className="btn-primary px-10 py-3 md:px-14 md:py-4 md:text-xl lg:text-2xl rounded-full font-bold">
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

  @media (min-width: 1024px) {
    .orders-container {
      max-width: 900px;
    }
    
    .orders-header {
      padding: 72px 0 48px;
    }

    .orders-title {
      font-size: 56px;
    }

    .orders-subtitle {
      font-size: 18px;
      margin-top: 24px !important;
    }

    .order-card {
      padding: 32px 40px;
      border-radius: 24px;
    }

    .order-card__id {
      font-size: 18px;
    }
    
    .order-card__date {
      font-size: 16px;
    }

    .order-card__total {
      font-size: 28px;
    }
    
    .order-badge {
      font-size: 15px;
      padding: 8px 18px;
    }
    
    .order-card__chevron {
      width: 28px;
      height: 28px;
    }

    .orders-list {
      gap: 24px;
    }
  }
`;
