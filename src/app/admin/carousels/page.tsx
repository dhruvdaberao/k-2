"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AdminCarousels() {
  const router = useRouter();
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTimer, setSavingTimer] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "success" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [slidesRes] = await Promise.all([
        supabase.from("hero_slides").select("*").order("position", { ascending: true })
      ]);

      if (slidesRes.data) setSlides(slidesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "success" }), 3000);
  };



  const moveSlide = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === slides.length - 1)
    ) return;

    const newSlides = [...slides];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap in state
    const temp = newSlides[index];
    newSlides[index] = newSlides[swapIndex];
    newSlides[swapIndex] = temp;

    // Re-assign positions based on array order
    const updatedSlides = newSlides.map((s, i) => ({ ...s, position: i }));
    setSlides(updatedSlides);

    // Persist to DB in parallel
    try {
      await Promise.all(
        updatedSlides.map((s) =>
          supabase.from("hero_slides").update({ position: s.position }).eq("id", s.id)
        )
      );
      showToast("Order updated!");
    } catch (err) {
      console.error(err);
      showToast("Failed to update order", "error");
      fetchData(); // revert
    }
  };

  const deleteSlide = async (id: string, imageUrl: string) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    try {
      const { error } = await supabase.from("hero_slides").delete().eq("id", id);
      if (error) throw error;

      // Extract filename from URL to delete from bucket
      if (imageUrl && !imageUrl.startsWith("/uploads")) {
        const parts = imageUrl.split("/");
        const filename = parts[parts.length - 1];
        if (filename) {
          await supabase.storage.from("carousel-images").remove([filename]);
        }
      }

      setSlides((prev) => prev.filter((s) => s.id !== id));
      showToast("Slide deleted!");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete slide", "error");
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #F5EFE6;
          border-radius: 0 0 16px 16px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c6b4a1;
          border-radius: 12px;
          border: 3px solid #F5EFE6;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #8B7355;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col items-center justify-center mb-8 gap-6 text-center relative">
          <div className="flex items-center justify-center w-full relative">
            <Link
              href="/admin"
              className="absolute left-0 p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors hidden sm:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#4A3219]">Manage Carousels</h1>
              <p className="text-stone-500 text-sm mt-1">Control the homepage hero slider and timing</p>
            </div>
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link 
              href="/admin/carousels/timer"
              className="text-xs md:text-sm font-bold transition-transform active:scale-95 flex items-center justify-center text-white hover:text-white px-4 py-2 md:px-6 md:py-3 rounded-lg"
              style={{ background: '#4A3219', color: '#ffffff', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textDecoration: 'none' }}
            >
              <span style={{ color: '#ffffff' }}>Edit Auto-Play Timer</span>
            </Link>
            <Link 
              href="/admin/carousels/new" 
              className="text-xs md:text-sm font-bold transition-transform active:scale-95 flex items-center justify-center text-white hover:text-white px-4 py-2 md:px-6 md:py-3 rounded-lg"
              style={{ background: '#4A3219', color: '#ffffff', border: 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', textDecoration: 'none' }}
            >
              <span style={{ color: '#ffffff' }}>+ Add New Slide</span>
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-[#4A3219] border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E6DCCF] overflow-hidden shadow-sm">
            <div className="md:hidden text-xs text-[#8B7355] p-2 bg-[#F5EFE6] border-b border-[#E6DCCF] flex items-center justify-center gap-1 font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              Swipe horizontally to view full table
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full min-w-[500px] md:min-w-[800px] text-left border-collapse">
                <thead>
                  <tr className="bg-[#FDFBF7] border-b border-[#E6DCCF] text-[10px] md:text-xs uppercase text-stone-500 font-semibold tracking-wider">
                    <th className="px-2 md:px-4 py-3 md:py-4 w-[15%] md:w-[15%] text-center">Order</th>
                    <th className="px-2 md:px-4 py-3 md:py-4 w-[25%] md:w-[20%] text-center">Image</th>
                    <th className="px-2 md:px-4 py-3 md:py-4 w-[40%] md:w-[35%]">Details</th>
                    <th className="px-2 md:px-4 py-3 md:py-4 w-[20%] md:w-[15%] text-center">Actions</th>
                    <th className="hidden md:table-cell px-4 py-4 w-[15%] text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DCCF]">
                  {slides.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-stone-500">
                        No slides found. Add one to get started!
                      </td>
                    </tr>
                  ) : (
                    slides.map((slide, idx) => (
                      <tr key={slide.id} className="hover:bg-[#FCFAFA] transition-colors">
                        <td className="px-2 md:px-4 py-3 md:py-4 w-[15%] md:w-[15%] text-center">
                          <div className="flex flex-col items-center gap-1">
                            <button 
                              onClick={() => moveSlide(idx, "up")}
                              disabled={idx === 0}
                              className={`p-1 ${idx === 0 ? "opacity-30 cursor-not-allowed" : "text-[#4A3219] hover:opacity-70 transition-opacity"}`}
                              style={{ background: 'none', border: 'none' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                            </button>
                            <span className="text-sm font-bold text-stone-700">{slide.position + 1}</span>
                            <button 
                              onClick={() => moveSlide(idx, "down")}
                              disabled={idx === slides.length - 1}
                              className={`p-1 ${idx === slides.length - 1 ? "opacity-30 cursor-not-allowed" : "text-[#4A3219] hover:opacity-70 transition-opacity"}`}
                              style={{ background: 'none', border: 'none' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-2 md:px-4 py-3 md:py-4 w-[25%] md:w-[20%]">
                          <div className="flex justify-center">
                            <div className="relative bg-stone-100 rounded-lg overflow-hidden border border-stone-200 w-[60px] h-[60px] md:w-[80px] md:h-[80px] min-w-[60px] md:min-w-[80px]">
                              {slide.image_url && (
                                <img src={slide.image_url} alt={slide.title} className="absolute inset-0 w-full h-full" style={{ objectFit: 'contain', padding: '4px' }} />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2 md:px-4 py-3 md:py-4 w-[40%] md:w-[35%]">
                          <div className="font-bold text-[#4A3219] text-sm md:text-base">{slide.title}</div>
                          <div className="text-xs md:text-sm text-stone-500 line-clamp-1 max-w-[150px] md:max-w-xs">{slide.subtitle}</div>
                          <div className="text-[10px] md:text-xs text-[#8B7355] mt-1 bg-[#F5EFE6] inline-block px-1.5 md:px-2 py-0.5 rounded">
                            {slide.primary_cta_label}
                          </div>
                        </td>
                        <td className="px-2 md:px-4 py-3 md:py-4 w-[20%] md:w-[15%] text-center">
                          <div className="flex justify-center gap-2">
                            <Link 
                              href={`/admin/carousels/${slide.id}`} 
                              className="text-xs md:text-sm font-bold transition-transform active:scale-95 flex items-center justify-center text-white hover:text-white px-3 py-1.5 md:px-5 md:py-2 rounded-lg"
                              style={{ background: '#4A3219', color: '#ffffff', border: 'none', textDecoration: 'none' }}
                            >
                              <span style={{ color: '#ffffff' }}>Edit</span>
                            </Link>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-4 w-[15%] text-center">
                          <span 
                            className="text-xs font-bold"
                            style={{ 
                              backgroundColor: slide.is_active ? '#dcfce7' : '#fee2e2', 
                              color: slide.is_active ? '#166534' : '#991b1b',
                              padding: '6px 12px',
                              borderRadius: '9999px',
                              display: 'inline-block'
                            }}
                          >
                            {slide.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {/* Toast */}
        {toast.show && (
          <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 z-50 ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}>
            {toast.msg}
          </div>
        )}
      </div>
    </main>
  );
}
