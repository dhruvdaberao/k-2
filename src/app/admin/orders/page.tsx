"use client";

import { isAdmin } from "@/lib/isAdmin";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import GlobalLoader from "@/components/ui/GlobalLoader";

type Order = {
  id: string;
  display_id: string;
  email?: string;
  total_amount: number;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("placed");
  const [search, setSearch] = useState("");

  // 1. Unified Auth & Data Fetching
  useEffect(() => {
    const init = async () => {
      try {
        // Auth check
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user || authData.user.email !== "keshvicrafts@gmail.com") {
          router.push("/");
          return;
        }

        // Fetch data immediately
        const { data: ordersData, error } = await supabase
          .from("orders")
          .select("id, display_id, email, status, total_amount, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setOrders(ordersData || []);
      } catch (err) {
        console.error("Admin Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Fail-safe timeout
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, [router]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/70 z-[9999]">
        <div className="w-10 h-10 border-4 border-[#5A3E2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
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
    <main className="min-h-screen bg-[#FDFBF7] py-20 px-4 md:px-6" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-6 flex flex-col gap-2">
          <Link href="/admin" className="text-[13px] text-[#6B6B6B] hover:text-[#5A3E2B] font-medium flex items-center gap-1 w-fit transition-colors">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#5A3E2B]">Manage Orders</h1>
        </header>

        {/* CONTROLS (SEARCH & FILTERS) */}
        <div className="mb-6 flex flex-col gap-5" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input
            type="text"
            placeholder="Search by Order ID or Email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white transition-colors"
            style={{ 
              height: '44px', 
              padding: '0 16px', 
              borderRadius: '8px', 
              border: '2px solid #5A3E2B', 
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
                  background: '#5A3E2B',
                  color: '#FFFFFF',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  outline: filter === status ? '2px solid #5A3E2B' : 'none',
                  outlineOffset: '2px',
                  fontWeight: filter === status ? 700 : 500,
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
          <div className="bg-white rounded-2xl text-center shadow-sm" style={{ padding: '48px', border: '1px solid #E6DCCF' }}>
            <div style={{ marginBottom: '24px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#5A3E2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
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
                <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-[#E6DCCF] hover:border-[#5A3E2B]/30 transition-all space-y-3">
                  
                  {/* Top Row */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-[#5A3E2B] tracking-tight">
                        {order.display_id || order.id.slice(0, 8)}
                      </span>
                      <span className="text-[12px] text-gray-500 font-medium" style={{ marginTop: '2px' }}>
                        {order.email || "No email provided"}
                      </span>
                    </div>
                    <div>
                      <span 
                        className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap max-w-fit shadow-sm"
                        style={{ 
                          backgroundColor: statusColor.bg, 
                          color: statusColor.text,
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row */}
                  <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                    {formatDate(order.created_at)}
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-center gap-4 pt-1 border-t border-gray-50 mt-2">
                    <p className="text-[16px] font-black text-[#5A3E2B]">
                      ₹{order.total_amount}
                    </p>
                    <Link 
                      href={`/admin/orders/${order.id}`} 
                      className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-[#5A3E2B] text-white hover:brightness-110 active:scale-95 transition-all shadow-sm"
                      style={{ textDecoration: 'none' }}
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
      <style>{`@keyframes co-spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
