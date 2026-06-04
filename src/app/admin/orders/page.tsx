"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import OrderSkeleton from "@/components/ui/OrderSkeleton";
import { isAdmin } from "@/lib/isAdmin";

type Order = {
  id: string;
  display_id: string;
  email?: string;
  total_amount: number;
  shipping_charge?: number | null;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, { bg: string, text: string }> = {
  placed: { bg: "#FFF4CC", text: "#B58B00" },
  shipped: { bg: "#E3F2FD", text: "#1565C0" },
  delivered: { bg: "#E8F5E9", text: "#2E7D32" },
  cancelled: { bg: "#FDECEA", text: "#C62828" },
  // Fallbacks
  confirmed: { bg: "#E0ECFA", text: "#3B6CB5" }
};

export default function AdminOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState("placed");
  const [search, setSearch] = useState("");

  // 1. Unified Auth & Data Fetching
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (sessionError) {
          console.warn("Auth check error (bypassing strict redirect):", sessionError);
        } else if (!sessionData?.session?.user || !isAdmin(sessionData.session.user)) {
          if (isMounted) router.push("/");
          return;
        }

        const res = await fetch(`/api/admin/orders?t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          cache: 'no-store'
        });
        
        if (!res.ok) throw new Error("Failed to fetch");

        const result = await res.json();

        if (!result.success) {
          throw new Error(result.error);
        } else {
          if (isMounted) {
            setOrders(result.orders || []);
            setError(false);
          }
        }
      } catch (err) {
        console.error("Admin Load Error:", err);
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    // Fail-safe timeout
    const timeout = setTimeout(() => {
      if (isMounted && orders === null) {
        setLoading(false);
        setError(true);
      }
    }, 8000);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] py-20 px-4 md:px-6" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
        <OrderSkeleton type="list" />
      </main>
    );
  }

  if (error || orders === null) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] pt-24 md:pt-28 pb-20 px-4 md:px-6" style={{ paddingBottom: '5rem' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#F5EFE6] text-center shadow-sm" style={{ padding: '48px', border: '1px solid #D4C4B0', borderRadius: '24px', maxWidth: '400px', margin: '40px auto' }}>
            <div style={{ marginBottom: '24px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#5A3E2B]" style={{ marginBottom: '8px' }}>Failed to load</h3>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px', marginBottom: '24px' }}>There was a problem loading your orders. Please check your connection and try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#5A3E2B] text-white py-3 rounded-xl font-bold transition hover:bg-[#3E2A1D]"
            >
              Reload Page
            </button>
          </div>
        </div>
      </main>
    );
  }

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = order.status === filter;
    
    const searchLower = search.toLowerCase();
    const orderEmail = order.email || "";
    
    const matchesSearch = 
      (order.display_id || "").toLowerCase().includes(searchLower) ||
      orderEmail.toLowerCase().includes(searchLower);

    return matchesFilter && (search === "" || matchesSearch);
  });

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status] || { bg: "#F3F4F6", text: "#374151" };
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] pt-24 md:pt-28 pb-20 px-4 md:px-6" style={{ paddingBottom: '5rem' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="relative text-center mb-8 mt-6">
          <Link
            href="/admin"
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors flex items-center justify-center"
            style={{ textDecoration: "none" }}
            title="Back to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <h1 className="text-3xl font-bold text-[#4A3219] mb-1" style={{ margin: 0 }}>Manage Orders</h1>
          <p className="text-[#8B7355]" style={{ margin: 0 }}>View and manage customer orders</p>
        </div>

        {/* CONTROLS (SEARCH & FILTERS) */}
        <div className="mb-6 flex flex-col gap-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="text"
            placeholder="Search by Order ID or Email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent transition-colors search-input"
            style={{ 
              height: '48px', 
              padding: '0 24px', 
              borderRadius: '999px', 
              border: '1px solid rgba(139, 94, 60, 0.4)', 
              fontSize: '14px', 
              outline: 'none',
              width: '100%'
            }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {["placed", "shipped", "delivered", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className="capitalize transition-all duration-200"
                style={{
                  background: filter === status ? '#5A3E2B' : '#F5EFE6',
                  color: filter === status ? '#FFFFFF' : '#5A3E2B',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  border: filter === status ? 'none' : '1px solid #E6DCCF',
                  outline: 'none',
                  fontWeight: filter === status ? 800 : 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: 1
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* LIST */}
        {filteredOrders.length === 0 ? (
          <div className="bg-[#F5EFE6] text-center shadow-sm" style={{ padding: '48px', border: '1px solid #D4C4B0', borderRadius: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#5A3E2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <rect x="2" y="8" width="20" height="14" rx="2" ry="2" fill="none"/>
                <path d="M7 11V6a5 5 0 0 1 10 0v5" fill="none"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#5A3E2B]" style={{ marginBottom: '8px' }}>No orders found</h3>
            <p className="text-[#6B6B6B]" style={{ fontSize: '14px' }}>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order) => {
              const statusColor = getStatusColor(order.status);
              return (
                <div key={order.id} className="p-5 shadow-sm border transition-all space-y-3" style={{ backgroundColor: '#F5EFE6', borderRadius: '24px', borderColor: '#D4C4B0' }}>
                  
                  {/* Top Row */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-[14px] font-black text-[#5A3E2B] tracking-tight m-0" style={{ fontFamily: 'Quicksand, sans-serif' }}>
                        {order.display_id || order.id.slice(0, 8)}
                      </p>
                      <span 
                        className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap shadow-sm border"
                        style={{ 
                          backgroundColor: statusColor.bg, 
                          color: statusColor.text,
                          borderColor: statusColor.text + '40'
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 font-medium truncate m-0">
                      {order.email || "No email provided"}
                    </p>
                  </div>

                  {/* Middle Row */}
                  <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                    {formatDate(order.created_at)}
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-center gap-2 pt-1 border-t border-gray-50 mt-2">
                    <p className="text-[16px] font-black text-[#5A3E2B] m-0">
                      ₹{order.total_amount}
                    </p>
                    <Link 
                      href={`/admin/orders/${order.id}`} 
                      className="transition text-[12px] uppercase tracking-widest shadow-sm view-order-btn whitespace-nowrap text-center shrink-0 flex items-center justify-center rounded-xl"
                      style={{ backgroundColor: '#5a3e2b', color: '#ffffff', textDecoration: 'none', border: 'none', height: '42px', padding: '0 20px', fontWeight: 700, fontFamily: 'Quicksand, sans-serif' }}
                    >
                      View Order
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        @keyframes co-spin { to { transform: rotate(360deg); } }
        .view-order-btn, .view-order-btn:hover, .view-order-btn:visited, .view-order-btn:active, .view-order-btn:focus {
          color: #ffffff !important;
          text-decoration: none !important;
        }
        .search-input:focus {
          border-color: #5A3E2B !important;
        }
        @media (min-width: 1024px) {
          .max-w-4xl { max-width: 1200px !important; }
          h1 { font-size: 3.5rem !important; margin-bottom: 8px !important; }
          p { font-size: 1.25rem !important; }
          .search-input { height: 64px !important; font-size: 1.25rem !important; border-radius: 20px !important; }
          .flex-col > div.p-5 { padding: 32px !important; border-radius: 32px !important; }
          .text-\\[14px\\] { font-size: 1.5rem !important; }
          .text-\\[12px\\] { font-size: 1.1rem !important; }
          .text-\\[10px\\] { font-size: 1rem !important; padding: 6px 16px !important; }
          .text-\\[11px\\] { font-size: 1rem !important; }
          .text-\\[16px\\] { font-size: 2rem !important; }
          .view-order-btn { height: 56px !important; font-size: 1.1rem !important; padding: 0 32px !important; border-radius: 16px !important; }
          .gap-10px { gap: 16px !important; }
          button.capitalize { font-size: 1rem !important; padding: 12px 24px !important; }
        }
      `}</style>
    </main>
  );
}
