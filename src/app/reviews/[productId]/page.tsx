"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import products from "@/data/products.json"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { getProductRating } from "@/lib/ratingUtils"
import { showToast } from "@/components/Toast"

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

const SkeletonCard = () => (
  <div 
    style={{ 
      padding: '24px', 
      backgroundColor: '#f5f0ea', 
      borderRadius: '24px', 
      border: '1px solid #e8e2da', 
      marginBottom: '16px',
      opacity: 0.7
    }}
    className="animate-pulse"
  >
    <div style={{ display: 'flex', gap: '5px', marginBottom: '16px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} style={{ width: '16px', height: '16px', backgroundColor: '#e0d6cc', borderRadius: '50%' }} />
      ))}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ height: '12px', backgroundColor: '#e0d6cc', borderRadius: '6px', width: '80%' }} />
      <div style={{ height: '12px', backgroundColor: '#e0d6cc', borderRadius: '6px', width: '50%' }} />
    </div>
  </div>
);

const EmptyReviews = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <h3 className="text-[#5a3e2b] font-bold text-xl mb-2">
      No reviews yet
    </h3>
    <p className="text-gray-400 text-sm max-w-[280px] mx-auto leading-relaxed">
      Be the first to share your experience with this handcrafted product!
    </p>
  </div>
);

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

  // Custom Modal States
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null })
  const [duplicateModal, setDuplicateModal] = useState<{ show: boolean; existingReview: any }>({ show: false, existingReview: null })
  const [ineligibleModal, setIneligibleModal] = useState(false)
  const [ratingBreakdown, setRatingBreakdown] = useState<any>(null)
  const [sortBy, setSortBy] = useState("latest")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const getRatingBreakdown = async (pId: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", pId);

    if (error || !data) return null;

    const counts: Record<number, number> = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    data.forEach((r) => {
      if (counts[r.rating] !== undefined) {
        counts[r.rating] += 1;
      }
    });

    return {
      counts,
      total: data.length,
    };
  };

  const loadBreakdown = useCallback(async (pId: string) => {
    const result = await getRatingBreakdown(pId);
    setRatingBreakdown(result);
  }, []);

  const loadReviewsData = useCallback(async (pId: string) => {
    if (!pId) {
      setLoading(false);
      return;
    }
    console.log("🔍 [DEBUG] LOAD REVIEWS START for:", pId);
    setLoading(true);
    
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
      
      // 5. Load Breakdown
      await loadBreakdown(pId);

    } catch (err) {
      console.error("🔥 [CRITICAL] loadReviewsData crashed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Next.js Refresh Fix (Clears stale navigation state)
    router.refresh();

    const init = async () => {
      try {
        console.log("🚀 [INIT] ReviewPage start");
        
        if (!productId) {
          console.warn("⚠️ [INIT] No productId found");
          setLoading(false);
          return;
        }

        const slug = decodeURIComponent(productId);
        const p = (products as any[]).find(x => x.slug === slug || x.id === slug);
        
        if (p) {
          const productData = {
            id: p.id || p.slug, 
            name: p.title,
            image: p.images?.[0] || "/placeholder.png",
          };
          setProduct(productData);
          
          // Parallel load for efficiency
          await Promise.all([
            loadReviewsData(productData.id),
            loadBreakdown(productData.id)
          ]);
        } else {
          console.error("❌ [INIT] Product not found for slug:", slug);
          setLoading(false);
        }
      } catch (err) {
        console.error("🔥 [INIT] Crash:", err);
      } finally {
        setLoading(false);
      }
    };

    init();

    // 2. Fail-safe Timeout (Guarantee UI exit)
    const safety = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => clearTimeout(safety);
  }, [productId, loadReviewsData, loadBreakdown, router]);

  const handleOpenReview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setShowAuthPopup(true);
        return;
      }

      const pId = product?.id || productId;

      // 🔍 1. Check for duplicate review
      const { data: existing } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", pId)
        .maybeSingle();

      if (existing) {
        setDuplicateModal({ show: true, existingReview: existing });
        return;
      }

      // 🔒 2. Check delivered orders
      const { data: orderChecks, error: orderError } = await supabase
        .from("order_items")
        .select("order_id, orders!inner(id, status, user_id)")
        .eq("product_id", pId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "delivered");

      if (orderError) {
        console.error("Order check error:", orderError);
        showToast("Error checking order eligibility");
        return;
      }

      if (!orderChecks || orderChecks.length === 0) {
        setIneligibleModal(true);
        return;
      }

      // ✅ allowed → open modal
      setIsReviewOpen(true);

    } catch (err) {
      console.error("Open Review Error:", err);
      showToast("Something went wrong");
    }
  };

  const handleSubmitReview = async () => {
    try {
      setIsSubmitting(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast("Please login first");
        return;
      }

      if (rating === 0) {
        showToast("Please select a rating");
        return;
      }

      const pId = product?.id || productId;

      // 🔍 Check for duplicate review
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", pId)
        .limit(1);

      if (existing && existing.length > 0) {
        showToast("You have already reviewed this product");
        return;
      }

      // 🔒 Check delivered order
      // We check order_items and join with orders to verify status and ownership
      const { data: orderChecks, error: orderError } = await supabase
        .from("order_items")
        .select("order_id, orders!inner(id, status, user_id)")
        .eq("product_id", pId)
        .eq("orders.user_id", user.id)
        .eq("orders.status", "delivered");

      if (orderError) {
        console.error("Order check error:", orderError);
        showToast("Error verifying purchase status");
        return;
      }

      if (!orderChecks || orderChecks.length === 0) {
        showToast("You can only review delivered items");
        return;
      }

      // ✅ Insert review
      console.log("🆕 [INSERT] New Review");
      const { error } = await supabase.from("reviews").insert([
        {
          product_id: pId,
          user_id: user.id,
          order_id: orderChecks[0].order_id,
          rating: rating,
          review: reviewText,
        },
      ]);
      
      // OPTIMISTIC UPDATE: Add to UI immediately
      const tempReview = {
        id: 'temp-' + Date.now(),
        product_id: pId,
        user_id: user.id,
        rating: rating,
        review: reviewText,
        created_at: new Date().toISOString(),
        author_name: user.user_metadata?.name || user.email?.split('@')[0] || "You"
      };
      setReviews(prev => [tempReview, ...prev]);

      if (error) {
        console.error("Review save error:", error);
        showToast(error.message);
        return;
      }

      setReviewText("");
      setRating(0);
      setIsReviewOpen(false);
      setDuplicateModal({ show: false, existingReview: null });
      showToast("Review posted successfully");
      await loadReviewsData(pId);
      await loadBreakdown(pId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      router.refresh();

    } catch (err) {
      console.error("Submit Review Crash:", err);
      showToast("Something went wrong");
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
        showToast("DB DELETE FAILED");
        setReviews(previousReviews);
        return;
      }

      if (!data || data.length === 0) {
        console.error("❌ [DELETE] Forbidden. Data is empty.");
        showToast("Deletion failed! Check permissions.");
        setReviews(previousReviews);
        return;
      }

      console.log("✅ [DELETE] Success.");
      showToast("Review deleted successfully");
      if (product?.id) {
        const result = await getProductRating(product.id);
        setRatingData(result);
        await loadBreakdown(product.id);
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
            onClick={handleOpenReview}
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

        {/* RATING BREAKDOWN */}
        {ratingBreakdown && ratingBreakdown.total > 0 && (
          <div 
            className="mx-4 mb-6" 
            style={{ 
              backgroundColor: '#f8f4ef', 
              padding: '24px', 
              borderRadius: '28px', 
              border: '1px solid #f1ebe6',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}
          >
            <h3 style={{ color: '#5a3e2b', fontWeight: 800, marginBottom: '16px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Rating Breakdown
            </h3>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown.counts[star];
              const percent = ratingBreakdown.total > 0 ? (count / ratingBreakdown.total) * 100 : 0;

              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#5a3e2b', width: '40px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {star} <StarIcon filled={true} size={14} />
                  </span>
                  <div style={{ flex: 1, height: '10px', backgroundColor: 'white', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{ 
                        height: '100%', 
                        backgroundColor: '#5a3e2b', 
                        width: `${percent}%`, 
                        borderRadius: '999px',
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#888', width: '30px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* CUSTOM SORT DROPDOWN */}
        {reviews.length > 0 && (
          <div className="flex justify-end px-4 mb-8">
            <div style={{ position: 'relative', width: '180px' }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8f4ef',
                  border: '2px solid #e8e2da',
                  borderRadius: '16px',
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#5a3e2b',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(90, 62, 43, 0.05)',
                }}
              >
                <span>
                  {sortBy === 'latest' ? 'Latest First' : sortBy === 'high' ? 'Highest Rating' : 'Lowest Rating'}
                </span>
                <div style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', display: 'flex' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>
              </button>

              {isDropdownOpen && (
                <>
                  <div 
                    onClick={() => setIsDropdownOpen(false)} 
                    style={{ position: 'fixed', inset: 0, zIndex: 998 }} 
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '2px solid #e8e2da',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    zIndex: 999,
                    overflow: 'hidden',
                    animation: 'dropdownIn 0.2s ease-out'
                  }}>
                    {[
                      { val: 'latest', label: 'Latest First' },
                      { val: 'high', label: 'Highest Rating' },
                      { val: 'low', label: 'Lowest Rating' }
                    ].map((opt) => (
                      <div
                        key={opt.val}
                        onClick={() => {
                          setSortBy(opt.val);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          padding: '14px 20px',
                          fontSize: '14px',
                          fontWeight: sortBy === opt.val ? 800 : 600,
                          color: '#5a3e2b',
                          cursor: 'pointer',
                          backgroundColor: sortBy === opt.val ? '#f8f4ef' : 'transparent',
                          transition: 'all 0.2s ease',
                          borderBottom: opt.val !== 'low' ? '1px solid #f5f0eb' : 'none'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f4ef')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = sortBy === opt.val ? '#f8f4ef' : 'transparent')}
                      >
                        {opt.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes dropdownIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* REVIEW LIST */}
        <div className="px-4 space-y-4 pb-12" style={{ padding: '0 16px' }}>
          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyReviews />
          ) : (
            [...reviews]
              .sort((a, b) => {
                if (sortBy === "latest") {
                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                }
                if (sortBy === "high") {
                  return b.rating - a.rating;
                }
                if (sortBy === "low") {
                  return a.rating - b.rating;
                }
                return 0;
              })
              .map((r) => (
                <div
                  key={r.id}
                  className="transition-all duration-300 hover:translate-y-[-2px]"
                  style={{ padding: '24px', backgroundColor: '#f1ede8', borderRadius: '24px', border: '1px solid #e8e2da', marginBottom: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}
                >
                <div className="flex justify-between items-start">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '12px' }}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <StarIcon key={j} filled={j < r.rating} size={16} />
                      ))}
                    </div>
                    {r.review && (
                      <p style={{ margin: 0, fontSize: '15px', color: '#333', lineHeight: 1.7, fontWeight: 500 }}>
                        "{r.review}"
                      </p>
                    )}
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

      {/* INELIGIBLE MODAL */}
      {ineligibleModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10000 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '360px', padding: '32px', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#fff5f5', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            
            <h2 style={{ fontWeight: 800, fontSize: '22px', marginBottom: '12px', color: '#2d2d2d' }}>
              Order Required
            </h2>
            <p style={{ fontSize: '15px', color: '#666', marginBottom: '28px', lineHeight: 1.5 }}>
              You can only review products that have been purchased and successfully delivered to you. 
            </p>
            
            <button
              onClick={() => setIneligibleModal(false)}
              style={{ width: '100%', backgroundColor: '#5a3e2b', color: 'white', padding: '14px', borderRadius: '16px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(90, 62, 43, 0.2)' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* DUPLICATE REVIEW MODAL / EDIT SUGGESTION */}
      {duplicateModal.show && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 10000 }}>
          <div style={{ backgroundColor: 'white', width: '100%', maxWidth: '360px', padding: '32px', borderRadius: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#f8f4ef', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            
            <h2 style={{ fontWeight: 800, fontSize: '22px', marginBottom: '12px', color: '#2d2d2d' }}>
              Already Reviewed
            </h2>
            <p style={{ fontSize: '15px', color: '#666', marginBottom: '28px', lineHeight: 1.5 }}>
              You have already shared your thoughts on this item. Would you like to edit your existing review from your reviews page?
            </p>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setDuplicateModal({ show: false, existingReview: null })}
                style={{ flex: 1, backgroundColor: '#f5f5f5', color: '#666', padding: '12px', borderRadius: '16px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
              >
                No, Thanks
              </button>
              <button
                onClick={() => router.push("/my-reviews")}
                style={{ flex: 1, backgroundColor: '#5a3e2b', color: 'white', padding: '12px', borderRadius: '16px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(90, 62, 43, 0.2)' }}
              >
                My Reviews
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
