"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import productsData from "@/data/products.json"

// Reusable Curved Star Component
const StarIcon = ({ filled, size = 16, onClick }: { filled: boolean; size?: number; onClick?: () => void }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? "#5a3e2b" : "none"} 
    stroke={filled ? "#5a3e2b" : "#ccc"} 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transition: 'all 0.2s ease', cursor: onClick ? 'pointer' : 'default' }}
    onClick={onClick}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

export default function MyReviewsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Custom Delete Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null })
  
  // Edit Modal State
  const [editModal, setEditModal] = useState<{ show: boolean; review: any }>({ show: false, review: null })
  const [tempRating, setTempRating] = useState(0)
  const [tempReview, setTempReview] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  // Auth Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUser(user)
      fetchUserReviews(user.id)
    }
    checkUser()
  }, [])

  const fetchUserReviews = async (userId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          rating,
          review,
          created_at,
          product_id
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error

      const enriched = (data || []).map(r => {
        const p = (productsData as any[]).find(x => x.id === r.product_id || x.slug === r.product_id)
        return {
          ...r,
          product_name: p?.title || "Unknown Product",
          product_image: p?.images?.[0] || "/placeholder.png"
        }
      })

      setReviews(enriched)
    } catch (err) {
      console.error("Fetch reviews error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async () => {
    const reviewId = deleteConfirm.id;
    if (!reviewId) return;
    try {
      setDeleteConfirm({ show: false, id: null });
      const previousReviews = [...reviews];
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) {
        alert("Deletion failed! Ensure you have RLS delete permissions.");
        setReviews(previousReviews);
      }
    } catch (err) { console.error(err); }
  };

  const handleEditOpen = (review: any) => {
    setEditModal({ show: true, review });
    setTempRating(review.rating);
    setTempReview(review.review);
  };

  const handleUpdateReview = async () => {
    if (!editModal.review) return;
    try {
      setIsUpdating(true);
      console.log("📝 Updating review:", editModal.review.id);
      
      const { data, error } = await supabase
        .from("reviews")
        .update({
          rating: tempRating,
          review: tempReview
        })
        .eq("id", editModal.review.id)
        .select();

      if (error) {
        console.error("❌ Update error:", error);
        alert("Update failed: " + error.message);
        return;
      }

      if (!data || data.length === 0) {
        console.error("❌ No rows updated. Likely RLS issue.");
        alert("Update failed! Your database blocked the change. Please ensure you have run the RLS 'UPDATE' policy script in Supabase.");
        return;
      }

      // Update local state
      setReviews(prev => prev.map(r => 
        r.id === editModal.review.id 
        ? { ...r, rating: tempRating, review: tempReview } 
        : r
      ));
      
      console.log("✅ Update successful");
      setEditModal({ show: false, review: null });
    } catch (err) {
      console.error("🔥 Crash during update:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredReviews = reviews.filter(r =>
    r.review.toLowerCase().includes(search.toLowerCase()) ||
    r.product_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100vh] bg-white">
        <div className="w-10 h-10 border-4 border-[#5a3e2b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[100vh] bg-white px-4 text-center">
        <h2 className="text-xl font-bold mb-2 text-[#1a1a1a]">Please login to view your reviews</h2>
        <button onClick={() => router.push("/login")} className="bg-[#5a3e2b] text-white px-8 py-3 rounded-full font-bold mt-4 shadow-lg">Login Now</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20" style={{ fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <div className="bg-white px-4 flex items-center justify-between" style={{ display: 'flex', position: 'relative', paddingTop: '60px', paddingBottom: '16px' }}>
        <button
          onClick={() => router.push("/profile")}
          style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#5a3e2b', zIndex: 10 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>My Reviews</h1>
        <div style={{ width: '40px' }}></div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 16px' }}>
        <p className="text-center text-sm text-gray-500 mt-2 mb-8">Manage and view all your product reviews</p>

        {/* SEARCH BAR */}
        <div className="relative mb-8" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="absolute" style={{ left: '20px', opacity: 0.4, display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <input
            type="text" placeholder="Search your reviews..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '16px 16px 16px 60px', borderRadius: '12px', border: '2px solid #5a3e2b', backgroundColor: 'white', outline: 'none', fontSize: '15px', color: '#5a3e2b', fontWeight: 500 }}
          />
        </div>

        {/* REVIEW LIST */}
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-[#f8f4ef] rounded-2xl p-5 shadow-sm border border-[#f1ebe6]">
              <div className="flex items-center gap-4">
                <div style={{ width: '60px', height: '60px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <img src={review.product_image} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1a1a1a]">{review.product_name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>

              <p className="mt-4 text-[15px] text-[#333] leading-relaxed">"{review.review}"</p>

              <div className="mt-4 flex justify-between items-center">
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} filled={i < review.rating} size={18} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditOpen(review)}
                    style={{ backgroundColor: 'white', color: '#5a3e2b', border: '1.5px solid #5a3e2b', padding: '8px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
                  >
                    EDIT
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ show: true, id: review.id })}
                    style={{ backgroundColor: '#5a3e2b', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 10px rgba(90, 62, 43, 0.2)' }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EDIT MODAL */}
      {editModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10000 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#1a1a1a', marginBottom: '8px' }}>Edit Review</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}>Update your feedback for <b>{editModal.review?.product_name}</b></p>
            
            {/* Rating Selector */}
            <div className="flex gap-2 mb-6 justify-center bg-[#f8f4ef] p-4 rounded-2xl">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} filled={i < tempRating} size={32} onClick={() => setTempRating(i + 1)} />
              ))}
            </div>

            {/* Text Area */}
            <textarea
              value={tempReview}
              onChange={(e) => setTempReview(e.target.value)}
              placeholder="Write your updated review..."
              style={{ width: '100%', height: '120px', padding: '16px', borderRadius: '16px', border: '1.5px solid #e1e1e1', backgroundColor: '#fafafa', fontSize: '15px', color: '#333', outline: 'none', marginBottom: '24px', resize: 'none' }}
            />
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                disabled={isUpdating}
                onClick={() => setEditModal({ show: false, review: null })}
                style={{ flex: 1, backgroundColor: '#f5f5f5', color: '#666', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                disabled={isUpdating}
                onClick={handleUpdateReview}
                style={{ flex: 1, backgroundColor: '#5a3e2b', color: 'white', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(90, 62, 43, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10000 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '340px', padding: '32px', borderRadius: '28px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ backgroundColor: '#fff5f5', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></div>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#2d2d2d', marginBottom: '12px' }}>Delete Review?</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '28px' }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteConfirm({ show: false, id: null })} style={{ flex: 1, backgroundColor: '#f5f5f5', color: '#666', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteReview} style={{ flex: 1, backgroundColor: '#5a3e2b', color: 'white', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(90, 62, 43, 0.2)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
