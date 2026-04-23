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
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [filter, setFilter] = useState("placed");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user || null);
      setAuthLoading(false);
    };
    getUser();
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin(user)) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !isAdmin(user)) return;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, display_id, email, status, total_amount, created_at")
        .order("created_at", { ascending: false });
        
      if (!error && data) {
        setOrders(data);
      } else {
        console.error("Error fetching orders:", error);
      }
      setOrdersLoading(false);
    };

    fetchOrders();
  }, [user]);


  if (authLoading || ordersLoading) {
    return <GlobalLoader message="Loading orders..." />;
  }

  if (!isAdmin(user)) {
    return null;
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
                <div key={order.id} className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] border border-transparent hover:border-[#E6DCCF] transition-colors flex flex-col gap-3">
                  
                  {/* Top Row */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col">
                      <span className="text-[16px] font-semibold text-[#2D2D2D]">
                        {order.display_id || order.id.slice(0, 8)}
                      </span>
                      <span className="text-[13px] text-[#6B6B6B]" style={{ marginTop: '4px' }}>
                        {order.email || "No email provided"}
                      </span>
                    </div>
                    <div>
                      <span 
                        className="capitalize tracking-wide whitespace-nowrap"
                        style={{ 
                          backgroundColor: statusColor.bg, 
                          color: statusColor.text,
                          padding: '4px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 500,
                          display: 'inline-block'
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row */}
                  <div className="text-[13px] text-[#6B6B6B]">
                    {formatDate(order.created_at)}
                  </div>

                  {/* Bottom Row */}
                  <div className="flex justify-between items-center gap-4 pt-1">
                    <p className="text-[18px] font-semibold text-[#2D2D2D]">
                      ₹{order.total_amount}
                    </p>
                    <Link 
                      href={`/admin/orders/${order.id}`} 
                      style={{
                        backgroundColor: '#5A3E2B',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                      className="hover:opacity-90 transition-opacity text-center whitespace-nowrap shadow-sm"
                    >
                      <span style={{ color: '#FFFFFF' }}>View Order</span>
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
