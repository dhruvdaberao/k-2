"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import products from "@/data/products.json"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { getProductRating } from "@/lib/ratingUtils"

// Reusable Curved Star Component
const StarIcon = ({ filled, size = 16 }: { filled: boolean; size?: number }) => (
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
    style={{ transition: 'all 0.2s ease' }}
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

export default function ReviewPage() {
  const params = useParams()
  const productId = params?.productId as string
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [ratingData, setRatingData] = useState<{ avg: string | null; count: number }>({ avg: null, count: 0 })
  const [loading, setLoading] = useState(true)

  // Auth Effect
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [showAuthPopup, setShowAuthPopup] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Custom Delete Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null })

  const loadReviewsData = useCallback(async (pId: string) => {
    if (!pId) return;
    console.log("🔍 [DEBUG] LOAD REVIEWS START for:", pId);
    
    try {
      // 1. Fetch Reviews
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", pId)
        .order("created_at", { ascending: false });

      if (reviewError) {
        console.error("❌ [REVIEWS] FETCH ERROR:", reviewError);
        setReviews([]);
        return;
      }

      if (!reviewData || reviewData.length === 0) {
        setReviews([]);
        setRatingData({ avg: null, count: 0 });
        return;
      }

      // 2. Fetch Profiles safely
      const userIds = Array.from(new Set(reviewData.map(r => r.user_id)));
      
      // FIXED: The column in your DB is 'name', not 'full_name'
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name") 
        .in("id", userIds);

      if (profileError) {
        console.error("❌ [PROFILES] FETCH ERROR:", profileError);
      }

      const profileMap = (profileData || []).reduce((acc: any, p: any) => {
        acc[p.id] = p.name;
        return acc;
      }, {});

      // 3. Map names
      const enrichedReviews = reviewData.map(r => ({
        ...r,
        author_name: profileMap[r.user_id] || "Verified Customer"
      }));

      setReviews(enrichedReviews);
      
      // 4. Update rating stats
      const result = await getProductRating(pId);
      setRatingData(result);

    } catch (err) {
      console.error("🔥 [CRITICAL] loadReviewsData crashed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!productId) return;
    
    const slug = decodeURIComponent(productId);
    const p = (products as any[]).find(x => x.slug === slug || x.id === slug);
    
    if (p) {
      const productData = {
        id: p.id || p.slug, 
        name: p.title,
        image: p.images?.[0] || "/placeholder.png",
      }
      setProduct(productData);
      loadReviewsData(productData.id);
    } else {
      setLoading(false);
    }
  }, [productId, loadReviewsData]);

  const handleSubmitReview = async () => {
    try {
      setIsSubmitting(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        setShowAuthPopup(true);
        return;
      }

      if (rating === 0) {
        alert("Please select a rating");
        return;
      }

      const pId = product?.id || productId;

      const { error: insertError } = await supabase.from("reviews").insert([
        {
          product_id: pId,
          user_id: currentUser.id,
          rating: rating,
          review: reviewText || "",
        },
      ]);

      if (insertError) {
        console.error("❌ INSERT FAILED:", insertError);
        alert("Post Failed: " + insertError.message);
        return;
      }

      setReviewText("");
      setRating(0);
      setIsReviewOpen(false);
      await loadReviewsData(pId);
      router.refresh();

    } catch (err) {
      console.error("🔥 SUBMIT CRASH:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    const reviewId = deleteConfirm.id;
    if (!reviewId) return;

    try {
      console.log("🗑️ [DELETE] Requesting removal for:", reviewId);
      setDeleteConfirm({ show: false, id: null });

      const previousReviews = [...reviews];
      setReviews(prev => prev.filter(r => r.id !== reviewId));

      // Use .match for exact match
      const { data, error } = await supabase
        .from("reviews")
        .delete()
        .match({ id: reviewId })
        .select();

      if (error) {
        console.error("❌ [DELETE] DB Error:", error);
        alert("DB DELETE FAILED: " + error.message);
        setReviews(previousReviews);
        return;
      }

      if (!data || data.length === 0) {
        console.error("❌ [DELETE] Forbidden. Data is empty.");
        alert("DELETION FAILED!\n\nYou don't have permission to delete this review in the database.\n\nPLEASE RUN THIS IN SUPABASE SQL EDITOR:\n\nCREATE POLICY \"Users can delete their own reviews\" ON reviews FOR DELETE USING (auth.uid() = user_id);");
        setReviews(previousReviews);
        return;
      }

      console.log("✅ [DELETE] Success.");
      if (product?.id) {
        const result = await getProductRating(product.id);
        setRatingData(result);
      }
      router.refresh();
    } catch (err: any) {
      console.error("🔥 [DELETE] CRASH:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[100vh] bg-white">
        <div className="w-10 h-10 border-4 border-[#5a3e2b] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-[100vh] bg-white px-4 text-center">
        <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
        <button onClick={() => router.back()} className="text-[#5a3e2b] underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'sans-serif' }}>
      {/* HEADER */}
      <div className="bg-white px-4 flex items-center justify-between" style={{ display: 'flex', position: 'relative', paddingTop: '60px', paddingBottom: '16px' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#5a3e2b' }}
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
          Product Reviews
        </h1>

        <div style={{ width: '40px' }}></div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* SUBHEADING */}
        <div style={{ textAlign: 'center', marginTop: '4px', marginBottom: '24px', padding: '0 20px' }}>
          <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic', maxWidth: '380px', margin: '0 auto', lineHeight: 1.5 }}>
            Discover what our community has to say about this handcrafted piece, made with love and care.
          </p>
        </div>

        {/* PRODUCT INFO CARD */}
        <div className="mx-4 p-4 rounded-2xl flex items-center justify-between" style={{ backgroundColor: '#f8f4ef', borderRadius: '24px', display: 'flex', padding: '20px', border: '1px solid #f1ebe6' }}>
          <div style={{ flex: 1, marginRight: '16px' }}>
            <p className="font-bold text-lg text-[#2d2d2d]" style={{ margin: '0 0 6px 0', fontSize: '18px' }}>
              {product.name}
            </p>
            <div className="flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center' }}>
              {ratingData.count === 0 ? (
                <span className="text-sm text-gray-400">No reviews yet</span>
              ) : (
                <>
                  <StarIcon filled={true} size={20} />
                  <span className="text-base text-[#5a3e2b] font-bold" style={{ fontSize: '16px' }}>
                    {ratingData.avg} <span style={{ color: '#888', fontWeight: 400, fontSize: '14px' }}>({ratingData.count})</span>
                  </span>
                </>
              )}
            </div>
          </div>

          <div style={{ width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.08)' }}>
            <img
              src={product.image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>

        {/* ADD REVIEW BUTTON */}
        <div className="px-4 mt-6">
          <button
            onClick={() => {
              if (!user) {
                setShowAuthPopup(true)
              } else {
                setIsReviewOpen(true)
              }
            }}
            style={{ 
              width: '100%', 
              backgroundColor: '#5a3e2b', 
              color: 'white', 
              padding: '16px', 
              borderRadius: '999px', 
              border: 'none', 
              fontWeight: 800, 
              cursor: 'pointer',
              fontSize: '16px',
              boxShadow: '0 6px 20px rgba(90, 62, 43, 0.25)',
              transition: 'transform 0.2s ease'
            }}
          >
            Add a Review
          </button>
        </div>

        {/* SECTION TITLE */}
        <div style={{ padding: '0 20px', marginTop: '40px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ height: '1px', flex: 1, backgroundColor: '#eee' }}></div>
          <h2 style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1.2px', fontWeight: 800 }}>
            Customer Feedback
          </h2>
          <div style={{ height: '1px', flex: 1, backgroundColor: '#eee' }}></div>
        </div>

        {/* REVIEW LIST */}
        <div className="px-4 space-y-4 pb-12" style={{ padding: '0 16px' }}>
          {reviews.length === 0 ? (
            <div className="text-center py-10 text-gray-400 italic">Be the first to review this product!</div>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                style={{ padding: '24px', backgroundColor: '#f1ede8', borderRadius: '24px', border: '1px solid #e8e2da', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}
              >
                <div className="flex justify-between items-start">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '12px' }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <StarIcon key={j} filled={j < r.rating} size={16} />
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: '15px', color: '#333', lineHeight: 1.7, fontWeight: 500 }}>
                      "{r.review}"
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end" style={{ marginLeft: '16px' }}>
                    <p className="text-sm text-[#5a3e2b] opacity-70" style={{ margin: '0 0 12px 0', fontWeight: 600 }}>
                      – by {r.author_name}
                    </p>

                    {r.user_id === user?.id && (
                      <button
                        onClick={() => setDeleteConfirm({ show: true, id: r.id })}
                        style={{
                          backgroundColor: '#5a3e2b',
                          color: 'white',
                          border: 'none',
                          padding: '6px 16px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        DELETE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deleteConfirm.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10000 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '340px', padding: '32px', borderRadius: '28px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
            <div style={{ backgroundColor: '#fff5f5', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </div>
            
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#2d2d2d', marginBottom: '12px' }}>Delete Review?</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '28px', lineHeight: 1.5 }}>
              This action cannot be undone. Your review will be permanently removed from Keshvi Crafts.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDeleteConfirm({ show: false, id: null })}
                style={{ flex: 1, backgroundColor: '#f5f5f5', color: '#666', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReview}
                style={{ flex: 1, backgroundColor: '#5a3e2b', color: 'white', border: 'none', padding: '12px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(90, 62, 43, 0.2)' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW MODAL */}
      {isReviewOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '400px', padding: '36px', borderRadius: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <h2 style={{ textAlign: 'center', fontWeight: 900, marginBottom: '24px', color: '#1a1a1a', fontSize: '24px', letterSpacing: '-0.5px' }}>
              Add Your Review
            </h2>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'transform 0.2s ease' }}
                  onClick={() => setRating(i + 1)}
                >
                  <StarIcon filled={i < rating} size={40} />
                </button>
              ))}
            </div>

            <textarea
              placeholder="What did you love about this item?"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              style={{ width: '100%', border: '1px solid #eee', backgroundColor: '#fcfcfc', borderRadius: '20px', padding: '20px', fontSize: '16px', minHeight: '150px', resize: 'none', marginBottom: '28px', outline: 'none', color: '#333', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
            />

            <div style={{ display: 'flex', gap: '14px' }}>
              <button
                onClick={() => {
                  setIsReviewOpen(false)
                  setRating(0)
                  setReviewText("")
                }}
                style={{ flex: 1, border: '1px solid #eee', color: '#777', padding: '14px', borderRadius: '999px', background: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '14px' }}
              >
                Cancel
              </button>

              <button
                disabled={!rating || isSubmitting}
                onClick={handleSubmitReview}
                style={{ flex: 2, backgroundColor: '#5a3e2b', color: 'white', border: 'none', padding: '14px', borderRadius: '999px', cursor: 'pointer', fontWeight: 800, opacity: rating && !isSubmitting ? 1 : 0.5, boxShadow: rating ? '0 8px 20px rgba(90, 62, 43, 0.3)' : 'none', fontSize: '15px' }}
              >
                {isSubmitting ? "Posting..." : "Post Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTH POPUP */}
      {showAuthPopup && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '360px', padding: '32px', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <h2 style={{ fontWeight: 800, fontSize: '20px', marginBottom: '8px', color: '#2d2d2d' }}>
              Login Required
            </h2>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '24px', lineHeight: 1.5 }}>
              You can't rate products without an account. Please log in to share your experience.
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => router.push("/login")}
                style={{ flex: 1, backgroundColor: '#5a3e2b', color: 'white', padding: '12px', borderRadius: '999px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Login
              </button>
              <button
                onClick={() => router.push("/signup")}
                style={{ flex: 1, border: '2px solid #5a3e2b', color: '#5a3e2b', padding: '12px', borderRadius: '999px', background: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Signup
              </button>
            </div>
            
            <button
              onClick={() => setShowAuthPopup(false)}
              style={{ marginTop: '16px', background: 'none', border: 'none', color: '#aaa', fontSize: '13px', cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
