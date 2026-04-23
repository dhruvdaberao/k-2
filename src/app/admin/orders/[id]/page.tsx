"use client";

import { isAdmin } from "@/lib/isAdmin";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { showToast } from "@/components/Toast";
import GlobalLoader from "@/components/ui/GlobalLoader";
import PromptModal from "@/components/ui/PromptModal";
import ConfirmModal from "@/components/ui/ConfirmModal";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

type Order = {
  id: string;
  display_id: string;
  email: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address: any;
  order_items: OrderItem[];
  tracking_link?: string;
};

const STATUS_COLORS: Record<string, { bg: string, text: string }> = {
  placed: { bg: "#FFF4CC", text: "#B58B00" },
  shipped: { bg: "#E3F2FD", text: "#1565C0" },
  delivered: { bg: "#E8F5E9", text: "#2E7D32" },
  cancelled: { bg: "#FDECEA", text: "#C62828" },
};

export default function OrderDetails() {
  const params = useParams();
  const orderId = params.id as string;
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingLink, setTrackingLink] = useState("");
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);

  // 1. Unified Auth & Data Fetching
  useEffect(() => {
    if (!orderId) return;

    const init = async () => {
      try {
        // Auth check
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user || authData.user.email !== "keshvicrafts@gmail.com") {
          router.push("/");
          return;
        }

        // Fetch Order Details
        await fetchOrder();
      } catch (err) {
        console.error("Order Detail Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    // Fail-safe timeout
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timeout);
  }, [orderId, router]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("Error fetching order:", error);
      showToast("Order not found");
    } else {
      setOrder(data);
      
      // Handle tracking link from top-level or JSON fallback
      let link = data.tracking_link;
      if (!link && data.delivery_address) {
        const addr = typeof data.delivery_address === 'string' 
          ? JSON.parse(data.delivery_address) 
          : data.delivery_address;
        link = addr.tracking_link;
      }
      
      if (link) setTrackingLink(link);
    }
  };

  if (loading) {
    return <GlobalLoader message="Loading order details..." />;
  }

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;
    
    if (newStatus === "shipped" && !trackingLink.trim()) {
      showToast("Please enter a tracking link first");
      return;
    }

    if (newStatus === "cancelled") {
      setShowCancelPrompt(true);
      return;
    }

    executeStatusUpdate(newStatus);
  };

  const executeStatusUpdate = async (newStatus: string) => {

    setUpdating(true);

    try {
      console.log(`🔄 Calling admin update API: ${order.id} -> ${newStatus}`);

      const res = await fetch("/api/admin/update-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          newStatus,
          trackingLink: trackingLink.trim(),
          adminEmail: "keshvicrafts@gmail.com"
        })
      });

      const result = await res.json();
      console.log("✅ Admin update result:", result);

      if (!result.success) {
        showToast(result.error || "Failed to update status");
        setUpdating(false);
        return;
      }

      // Success! Update local state immediately
      setOrder(prev => prev ? { 
        ...prev, 
        status: newStatus,
        ...(newStatus === "shipped" ? { tracking_link: trackingLink } : {})
      } : null);

      const emailMsg = result.emailSent ? " & email sent ✉️" : "";
      showToast(`Order status updated successfully${emailMsg}`);

      // Refetch to get full fresh data
      setTimeout(() => fetchOrder(), 800);

    } catch (err: any) {
      console.error("❌ Status update error:", err);
      showToast("Something went wrong. Please try again.");
    }

    setUpdating(false);
  };

  if (!order) {
    return null;
  }

  const statusColor = STATUS_COLORS[order.status] || { bg: "#F3F4F6", text: "#374151" };
  const address = order.delivery_address || {};

  return (
    <main className="min-h-screen bg-[#FDFBF7] px-4 md:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        
        {/* BACK BUTTON */}
        <div className="mb-4">
          <Link href="/admin/orders" className="text-[12px] text-[#8B7355] hover:text-[#5A3E2B] font-bold flex items-center gap-1 transition-colors w-fit">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Back to Dashboard
          </Link>
        </div>

        {/* MAIN COMPACT CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E6DCCF] overflow-hidden">
          
          {/* TOP STATUS BANNER */}
          <div 
            className="px-4 py-3 border-b flex items-center justify-center"
            style={{ 
              backgroundColor: statusColor.bg, 
              borderColor: statusColor.text + '30'
            }}
          >
            <h2 className="text-sm font-black uppercase tracking-widest m-0" style={{ color: statusColor.text }}>
              Status : {order.status}
            </h2>
          </div>

          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            {/* INFO SECTION */}
            <div className="flex-grow flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-xs font-black text-[#5A3E2B] truncate">{order.display_id}</h1>
                <p className="text-[10px] text-gray-500 font-medium truncate">{order.email}</p>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
                <span>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span className="font-bold text-[#5A3E2B]">₹{order.total_amount}</span>
              </div>

              {/* ITEM CHIPS */}
              <div className="flex flex-wrap gap-2 mt-3">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-700">
                    {item.name} <span className="ml-1 text-[#5A3E2B]">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: ACTIONS */}
            <div className="w-full md:w-auto md:max-w-md flex flex-col gap-1">
              {order.status === "placed" && (
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Tracking Info</label>
                    <input 
                      type="text" 
                      placeholder="Paste tracking link..."
                      value={trackingLink}
                      onChange={(e) => setTrackingLink(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5A3E2B] outline-none text-xs font-bold text-[#5A3E2B] transition-all"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateOrderStatus("shipped")}
                      disabled={updating}
                      className="flex-1 transition rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest shadow-sm disabled:opacity-50"
                      style={{ backgroundColor: '#5a3e2b', color: '#ffffff', border: 'none' }}
                    >
                      {updating ? "Processing..." : "Ship Order"}
                    </button>
                    <button 
                      onClick={() => updateOrderStatus("cancelled")}
                      disabled={updating}
                      className="flex-1 transition rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest shadow-sm disabled:opacity-50"
                      style={{ backgroundColor: '#5a3e2b', color: '#ffffff', border: 'none' }}
                    >
                      {updating ? "Processing..." : "Cancel Order"}
                    </button>
                  </div>
                </div>
              )}

              {order.status === "shipped" && (
                <button 
                  onClick={() => updateOrderStatus("delivered")}
                  disabled={updating}
                  className="w-full transition rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest shadow-sm disabled:opacity-50"
                  style={{ backgroundColor: '#5a3e2b', color: '#ffffff', border: 'none' }}
                >
                  {updating ? "Processing..." : "Mark Delivered"}
                </button>
              )}

              {order.status === "delivered" && (
                <div className="px-4 py-2 rounded-lg bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-widest text-center border border-green-200 shadow-sm">
                  Delivered
                </div>
              )}

              {order.status === "cancelled" && (
                <div className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-[10px] font-black uppercase tracking-widest text-center border border-red-200 shadow-sm">
                  Cancelled
                </div>
              )}

              {/* QUICK ADDRESS FOOTER */}
              <p className="text-[9px] text-gray-400 mt-2 text-center md:text-right">
                Shipping to: <span className="font-bold text-gray-600">{address.city}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <PromptModal
        isOpen={showCancelPrompt}
        title="Confirm Cancellation"
        message='Please type "cancel" to confirm the cancellation of this order:'
        placeholder='Type "cancel" here'
        confirmLabel="Cancel Order"
        cancelLabel="Back"
        destructive
        onConfirm={(val) => {
          if (val.toLowerCase() === "cancel") {
            setShowCancelPrompt(false);
            executeStatusUpdate("cancelled");
          } else {
            showToast("Incorrect confirmation text.");
          }
        }}
        onCancel={() => setShowCancelPrompt(false)}
      />

    </main>
  );
}
