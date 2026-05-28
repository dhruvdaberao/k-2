"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { revalidateStorefront } from "@/actions/revalidate";
import { showToast } from "@/components/Toast";

export default function EditTimerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingTimer, setSavingTimer] = useState(false);
  const [timerValue, setTimerValue] = useState("4");

  useEffect(() => {
    const fetchTimer = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.from("site_settings").select("*").eq("setting_key", "carousel_delay").single();
        if (data?.setting_value?.ms) {
          setTimerValue(Math.floor(data.setting_value.ms / 1000).toString());
        }
      } catch (err) {
        console.error("Failed to load timer", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimer();
  }, []);



  const saveTimer = async () => {
    setSavingTimer(true);
    try {
      const sec = parseInt(timerValue);
      if (isNaN(sec) || sec < 1 || sec > 60) {
        showToast("Please enter a time between 1 and 60 seconds");
        setSavingTimer(false);
        return;
      }
      const { error } = await supabase
        .from("site_settings")
        .upsert({ setting_key: "carousel_delay", setting_value: { ms: sec * 1000 } });

      if (error) throw error;
      
      await revalidateStorefront();
      showToast("Timer updated successfully!");
      setTimeout(() => {
        router.push("/admin/carousels");
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast("Failed to update timer");
    } finally {
      setSavingTimer(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/carousels"
            className="p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <h1 className="text-xl md:text-3xl font-bold text-[#4A3219]">Edit Auto-Play Timer</h1>
        </div>

        <div className="bg-[#F5EFE6] rounded-[24px] border border-[#E6DCCF] shadow-sm p-6 md:p-8">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="w-8 h-8 rounded-full border-4 border-[#4A3219] border-t-transparent animate-spin"></div>
            </div>
          ) : (
            <div className="max-w-md">
              <label className="block text-sm font-bold text-stone-700 mb-2">Timer Duration</label>
              <div className="flex items-center gap-3 mb-2">
                <input 
                  type="number" 
                  min="1"
                  max="60"
                  value={timerValue} 
                  onChange={(e) => setTimerValue(e.target.value)} 
                  className="w-24 md:w-32 border border-stone-300 p-2 md:p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B7355] text-base md:text-lg font-bold text-[#4A3219]"
                />
                <span className="text-sm md:text-base text-stone-500 font-bold">seconds</span>
              </div>
              <p className="text-sm text-stone-500 mb-8">Enter a value between 1 and 60 seconds. This controls how fast the hero banner auto-rotates on the homepage.</p>
              
              <div className="flex gap-4 items-center">
                <button 
                  type="button" 
                  onClick={saveTimer} 
                  disabled={savingTimer} 
                  className="rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center px-4 py-2 md:px-6 md:py-3"
                  style={{ background: '#4A3219', color: '#ffffff', border: 'none' }}
                >
                  <span style={{ color: '#ffffff' }}>{savingTimer ? "Saving..." : "Save Timer"}</span>
                </button>
                <Link
                  href="/admin/carousels"
                  className="rounded-lg md:rounded-xl text-sm md:text-base font-bold transition-transform active:scale-95 flex items-center justify-center px-4 py-2 md:px-6 md:py-3"
                  style={{ background: '#4A3219', color: '#ffffff', border: 'none', textDecoration: 'none' }}
                >
                  <span style={{ color: '#ffffff' }}>Cancel</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        
      </div>
    </main>
  );
}
