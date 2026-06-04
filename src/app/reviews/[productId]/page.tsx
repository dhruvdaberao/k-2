"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { invalidateRatingCache, getCachedRating, ensureRatingsLoaded } from "@/lib/ratingCache"
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
    }}
  >
    <div style={{ display: 'flex', gap: '5px', marginBottom: '16px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="profile-skeleton-bar" style={{ width: '16px', height: '16px', borderRadius: '50%' }} />
      ))}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="profile-skeleton-bar" style={{ height: '16px', width: '40%', borderRadius: '4px' }} />
      <div className="profile-skeleton-bar" style={{ height: '16px', width: '80%', borderRadius: '4px' }} />
      <div className="profile-skeleton-bar" style={{ height: '16px', width: '60%', borderRadius: '4px' }} />
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
  const [reviewsLoaded, setReviewsLoaded] = useState(false) 

  // Auth Effect
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
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



  // === REVIEW DATA CACHE (localStorage) ===
  const REVIEW_CACHE_KEY = `kc:reviews:${productId}`;
  const REVIEW_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  const getCachedReviews = useCallback(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(REVIEW_CACHE_KEY);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts > REVIEW_CACHE_TTL) return null;
      return data as { reviews: any[]; ratingData: any; breakdown: any };
    } catch { return null; }
  }, [REVIEW_CACHE_KEY]);

  const setCachedReviews = useCallback((reviews: any[], rd: any, bd: any) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(REVIEW_CACHE_KEY, JSON.stringify({
        data: { reviews, ratingData: rd, breakdown: bd },
        ts: Date.now()
      }));
    } catch { /* ignore */ }
  }, [REVIEW_CACHE_KEY]);

  // Compute rating data locally from reviews (no extra Supabase call needed!)
  const computeRatingFromReviews = (reviewData: any[]) => {
    if (!reviewData || reviewData.length === 0) return { avg: null, count: 0 };
    const sum = reviewData.reduce((a: number, r: any) => a + r.rating, 0);
    return { avg: (sum / reviewData.length).toFixed(1), count: reviewData.length };
  };

  // Compute breakdown locally from reviews (no extra Supabase call needed!)
  const computeBreakdownFromReviews = (reviewData: any[]) => {
    if (!reviewData || reviewData.length === 0) return null;
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewData.forEach((r: any) => {
      if (counts[r.rating] !== undefined) counts[r.rating] += 1;
    });
    return { counts, total: reviewData.length };
  };

  const loadReviewsData = useCallback(async (pId: string) => {
    if (!pId) {
      setLoading(false);
      return;
    }
    
    try {
      // 1. Fetch Reviews + Profiles in parallel (2 queries instead of 4!)
      const fetchPromise = supabase
        .from("reviews")
        .select("*")
        .eq("product_id", pId)
        .order("created_at", { ascending: false });
        
      const response: any = await fetchPromise;
      const reviewData = response.data;
      const reviewError = response.error;

      if (reviewError) {
        console.error("[REVIEWS] FETCH ERROR:", reviewError);
        setReviews([]);
        setRatingData({ avg: null, count: 0 });
        setReviewsLoaded(true);
        setLoading(false);
        return;
      }

      if (!reviewData || reviewData.length === 0) {
        setReviews([]);
        setRatingData({ avg: null, count: 0 });
        setRatingBreakdown(null);
        setReviewsLoaded(true);
        setLoading(false);
        setCachedReviews([], { avg: null, count: 0 }, null);
        return;
      }

      // 2. Fetch Profiles
      const userIds = Array.from(new Set(reviewData.map((r: any) => r.user_id)));
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name") 
        .in("id", userIds);

      const profileMap = (profileData || []).reduce((acc: any, p: any) => {
        acc[p.id] = p.name;
        return acc;
      }, {});

      const enrichedReviews = reviewData.map((r: any) => ({
        ...r,
        author_name: profileMap[r.user_id] || "Verified Customer"
      }));

      // 3. Compute rating & breakdown LOCALLY (no extra Supabase calls!)
      const rd = computeRatingFromReviews(reviewData);
      const bd = computeBreakdownFromReviews(reviewData);

      setReviews(enrichedReviews);
      setRatingData(rd);
      setRatingBreakdown(bd);

      // 4. Cache for next visit
      setCachedReviews(enrichedReviews, rd, bd);

    } catch (err) {
      console.error("[CRITICAL] loadReviewsData crashed:", err);
    } finally {
      setReviewsLoaded(true);
      setLoading(false);
    }
  }, [setCachedReviews]);

  // INIT: Show cached data INSTANTLY, then refresh from Supabase in background
  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const slug = decodeURIComponent(productId);
    
    supabase.from("products").select("*").or(`slug.eq.${slug},id.eq.${slug}`).single().then(({ data: p }: { data: any }) => {
      if (!p) {
        setLoading(false);
        return;
      }

      const productData = {
        id: p.id || p.slug, 
        name: p.title,
        image: p.images?.[0] || "/placeholder.png",
      };
      setProduct(productData);

    // Try showing cached data INSTANTLY (before any network call)
    const cached = getCachedReviews();
    if (cached) {
      setReviews(cached.reviews);
      setRatingData(cached.ratingData);
      setRatingBreakdown(cached.breakdown);
      setReviewsLoaded(true);
      setLoading(false);
    } else {
      // If not in local cache, check global rating cache instantly
      const globalRating = getCachedRating(productData.id);
      if (globalRating && globalRating.count === 0) {
        setReviews([]);
        setRatingData({ avg: null, count: 0 });
        setRatingBreakdown(null);
        setReviewsLoaded(true);
        setLoading(false);
      } else if (globalRating && globalRating.count > 0) {
        setRatingData(globalRating);
      }
      
      ensureRatingsLoaded().then(() => {
        const updatedRating = getCachedRating(productData.id);
        if (updatedRating && updatedRating.count === 0) {
          setReviews([]);
          setRatingData({ avg: null, count: 0 });
          setRatingBreakdown(null);
          setReviewsLoaded(true);
          setLoading(false);
        } else if (updatedRating && updatedRating.count > 0) {
          setRatingData(prev => prev.count === 0 ? updatedRating : prev);
        }
      });
    }

    // Always refresh from Supabase in background (even if cache hit)
    loadReviewsData(productData.id);
    });
  }, [productId, loadReviewsData, getCachedReviews]);

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

      // 🔒 2. Check delivered orders via API (bypasses RLS issues)
      const eligRes = await fetch(`/api/reviews/check-eligibility?productId=${pId}&userId=${user.id}`);
      const eligData = await eligRes.json();

      if (!eligData.eligible) {
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

      // 🔒 Check delivered order via API (bypasses RLS issues)
      const eligRes = await fetch(`/api/reviews/check-eligibility?productId=${pId}&userId=${user.id}`);
      const eligData = await eligRes.json();

      if (!eligData.eligible) {
        showToast("You can only review delivered items");
        return;
      }

      // ✅ Insert review
      console.log("🆕 [INSERT] New Review");
      const { error } = await supabase.from("reviews").insert([
        {
          product_id: pId,
          user_id: user.id,
          order_id: null, // Bypassing unique_order_review constraint to allow multiple product reviews per order
          rating: rating,
          review: reviewText,
        },
      ]);

      if (error) {
        console.error("Review save error:", error);
        showToast(error.message || "Failed to save review");
        return;
      }


      setReviewText("");
      setRating(0);
      setIsReviewOpen(false);
      setDuplicateModal({ show: false, existingReview: null });
      showToast("Review posted successfully");
      invalidateRatingCache();
      await loadReviewsData(pId);
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
      invalidateRatingCache();
      if (product?.id) {
        await loadReviewsData(product.id);
      }
      router.refresh();
    } catch (err: any) {
      console.error("🔥 [DELETE] CRASH:", err);
    }
  };

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: 'sans-serif' }}>
        <div className="bg-white px-4 flex items-center justify-between" style={{ display: 'flex', position: 'relative', paddingTop: '60px', paddingBottom: '16px' }}>
          <div style={{ width: '40px' }}></div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', margin: 0, position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>Product Reviews</h1>
          <div style={{ width: '40px' }}></div>
        </div>
        <div className="reviews-container w-full pb-12">
          <div className="mx-4 p-4 rounded-2xl" style={{ backgroundColor: '#f8f4ef', borderRadius: '24px', marginBottom: '24px' }}>
            <div className="h-5 w-2/3 profile-skeleton-bar rounded mb-2"></div>
            <div className="h-4 w-1/3 profile-skeleton-bar rounded"></div>
          </div>
          <div className="space-y-4 px-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
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

      <div className="reviews-container w-full pb-12">
        
        {/* SUBHEADING */}
        <div className="text-center mt-2 mb-8 md:mb-12 px-4">
          <p className="text-sm md:text-lg lg:text-xl text-gray-500 italic max-w-sm md:max-w-2xl mx-auto leading-relaxed">
            Discover what our community has to say about this handcrafted piece, made with love and care.
          </p>
        </div>

        {/* PRODUCT INFO CARD */}
        <div className="product-info-card mx-4 md:mx-8">
          <div className="flex-1 pr-4 md:pr-8">
            <p className="product-title">
              {product.name}
            </p>
            <div className="flex items-center gap-1.5" style={{ display: 'flex', alignItems: 'center' }}>
              {!reviewsLoaded ? (
                <div className="flex items-center gap-2">
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#e0d6cc' }} className="animate-pulse" />
                  <div style={{ width: '60px', height: '16px', borderRadius: '4px', backgroundColor: '#e0d6cc' }} className="animate-pulse" />
                </div>
              ) : ratingData.count === 0 ? (
                <span className="text-sm text-gray-400">No reviews yet</span>
              ) : (
                <div className="flex items-center gap-1.5 md:gap-3">
                  <StarIcon filled={true} size={24} />
                  <span className="text-[#5a3e2b] font-bold flex items-center gap-1 text-[16px] md:text-2xl leading-none">
                    {ratingData.avg} <span className="text-gray-500 font-normal text-[14px] md:text-xl leading-none">({ratingData.count})</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="product-img-wrap">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* ADD REVIEW BUTTON */}
        <div className="px-4 md:px-8 mt-6 md:mt-10">
          <button
            onClick={handleOpenReview}
            className="add-review-btn"
          >
            Add a Review
          </button>
        </div>

        {/* SECTION TITLE */}
        <div className="customer-feedback-container">
          <div className="h-px flex-1 bg-gray-200"></div>
          <h2 className="customer-feedback-title">
            Customer Feedback
          </h2>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>

        {/* RATING BREAKDOWN */}
        {!reviewsLoaded ? (
          <div className="mx-4 mb-6 animate-pulse" style={{ backgroundColor: '#f8f4ef', padding: '24px', borderRadius: '28px', border: '1px solid #f1ebe6' }}>
            <div style={{ width: '120px', height: '12px', backgroundColor: '#e0d6cc', borderRadius: '4px', marginBottom: '16px' }} />
            {[5, 4, 3, 2, 1].map((star) => (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '14px', backgroundColor: '#e0d6cc', borderRadius: '4px' }} />
                <div style={{ flex: 1, height: '10px', backgroundColor: 'white', borderRadius: '999px' }} />
                <div style={{ width: '30px', height: '14px', backgroundColor: '#e0d6cc', borderRadius: '4px' }} />
              </div>
            ))}
          </div>
        ) : ratingBreakdown && ratingBreakdown.total > 0 && (
          <div className="rating-bd-card mx-4 md:mx-8">
            <h3 className="rating-breakdown-title">
              Rating Breakdown
            </h3>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingBreakdown.counts[star];
              const percent = ratingBreakdown.total > 0 ? (count / ratingBreakdown.total) * 100 : 0;

              return (
                <div key={star} className="rating-row">
                  <span className="rating-star-col">
                    {star} <StarIcon filled={true} size={16} />
                  </span>
                  <div className="rating-bar-bg">
                    <div
                      style={{ 
                        width: `${percent}%`, 
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
                      }}
                      className="h-full bg-[#5a3e2b] rounded-full"
                    />
                  </div>
                  <span className="rating-count-col">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* CUSTOM SORT DROPDOWN */}
        {reviews.length > 0 && (
          <div className="flex justify-end px-4 md:px-8 mb-8 md:mb-12">
            <div className="relative w-[180px] md:w-[240px]">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="sort-btn"
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
                          fontWeight: sortBy === opt.val ? 800 : 600,
                          color: '#5a3e2b',
                          cursor: 'pointer',
                          backgroundColor: sortBy === opt.val ? '#f8f4ef' : 'transparent',
                          transition: 'all 0.2s ease',
                          borderBottom: opt.val !== 'low' ? '1px solid #f5f0eb' : 'none'
                        }}
                        className="text-sm md:text-lg"
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
          .reviews-container { max-width: 600px; margin: 0 auto; }
          @media (min-width: 1024px) { .reviews-container { max-width: 900px; } }

          .product-info-card { background-color: #f8f4ef; border-radius: 24px; padding: 20px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #f1ebe6; margin-bottom: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
          @media (min-width: 1024px) { .product-info-card { border-radius: 32px; padding: 32px; margin-bottom: 48px; } }

          .product-title { font-size: 18px; font-weight: bold; color: #2d2d2d; margin-bottom: 8px; }
          @media (min-width: 1024px) { .product-title { font-size: 32px; margin-bottom: 16px; } }

          .product-img-wrap { width: 64px; height: 64px; border-radius: 16px; overflow: hidden; flex-shrink: 0; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.08); }
          @media (min-width: 1024px) { .product-img-wrap { width: 140px; height: 140px; border-radius: 24px; border: 4px solid white; } }

          .add-review-btn { width: 100%; background-color: #5a3e2b; color: white; padding: 16px; border-radius: 999px; font-weight: 800; font-size: 16px; border: none; cursor: pointer; box-shadow: 0 6px 20px rgba(90,62,43,0.25); transition: transform 0.2s ease; }
          .add-review-btn:hover { transform: scale(1.02); }
          @media (min-width: 1024px) { .add-review-btn { padding: 24px; font-size: 24px; } }

          .rating-bd-card { background-color: #f8f4ef; padding: 24px; border-radius: 28px; border: 1px solid #f1ebe6; margin-bottom: 32px; }
          @media (min-width: 1024px) { .rating-bd-card { padding: 40px; border-radius: 32px; margin-bottom: 48px; } }

          .rating-breakdown-title { color: #5a3e2b; font-weight: 800; margin-bottom: 16px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          @media (min-width: 1024px) { .rating-breakdown-title { font-size: 18px; margin-bottom: 24px; } }
          
          .customer-feedback-container { display: flex; align-items: center; gap: 16px; padding: 0 20px; margin-top: 48px; margin-bottom: 24px; }
          @media (min-width: 1024px) { .customer-feedback-container { padding: 0 40px; margin-top: 120px; margin-bottom: 40px; } }
          @media (min-width: 1024px) { .rating-breakdown-title { font-size: 16px; margin-bottom: 32px; } }

          .rating-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
          @media (min-width: 1024px) { .rating-row { gap: 20px; margin-bottom: 20px; } }

          .rating-star-col { font-size: 14px; font-weight: 800; color: #5a3e2b; width: 40px; display: flex; align-items: center; gap: 4px; }
          @media (min-width: 1024px) { .rating-star-col { font-size: 20px; width: 64px; } }

          .rating-bar-bg { flex: 1; height: 10px; background-color: white; border-radius: 999px; overflow: hidden; }
          @media (min-width: 1024px) { .rating-bar-bg { height: 16px; } }

          .rating-count-col { font-size: 13px; font-weight: 800; color: #888; width: 30px; text-align: right; }
          @media (min-width: 1024px) { .rating-count-col { font-size: 18px; width: 48px; } }

          .review-card { padding: 24px; background-color: #f1ede8; border-radius: 24px; border: 1px solid #e8e2da; margin-bottom: 16px; }
          @media (min-width: 1024px) { .review-card { padding: 40px; border-radius: 32px; margin-bottom: 24px; } }

          .sort-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; background-color: #f8f4ef; border: 2px solid #e8e2da; border-radius: 16px; padding: 12px 18px; font-size: 14px; font-weight: 800; color: #5a3e2b; cursor: pointer; outline: none; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(90, 62, 43, 0.05); }
          @media (min-width: 1024px) { .sort-btn { padding: 16px 24px; font-size: 18px; border-radius: 20px; } }

          @keyframes dropdownIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        
          .review-item-inner { display: flex; justify-content: space-between; align-items: flex-start; }
          .review-stars-wrap { display: flex; gap: 5px; margin-bottom: 12px; }
          .review-text { margin: 0; font-size: 15px; color: #333; line-height: 1.7; font-weight: 500; }
          .review-meta { text-align: right; display: flex; flex-direction: column; align-items: flex-end; margin-left: 16px; }
          .review-author { margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #5a3e2b; opacity: 0.7; }
          .review-delete-btn { background-color: #5a3e2b; color: white; border: none; padding: 6px 16px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s ease; }
          
          .customer-feedback-title { font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 800; }
          
          @media (min-width: 1024px) {
            .review-stars-wrap { gap: 8px; margin-bottom: 20px; }
            .review-text { font-size: 20px; }
            .review-author { font-size: 18px; margin-bottom: 16px; }
            .review-delete-btn { padding: 10px 24px; font-size: 14px; border-radius: 12px; }
            .customer-feedback-title { font-size: 20px; letter-spacing: 0.15em; }
          }
        `}</style>


        {/* REVIEW LIST */}
        <div className="space-y-4 md:space-y-6 pb-16 px-4 md:px-8">
          {(loading || !reviewsLoaded) ? (
            <div className="space-y-4 md:space-y-6">
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
                  className="review-card transition-transform duration-300 hover:-translate-y-1"
                >
                <div className="review-item-inner">
                  <div style={{ flex: 1 }}>
                    <div className="review-stars-wrap">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <StarIcon key={j} filled={j < r.rating} size={18} />
                      ))}
                    </div>
                    {r.review && (
                      <p className="review-text">
                        "{r.review}"
                      </p>
                    )}
                  </div>

                  <div className="review-meta">
                    <p className="review-author">
                      – by {r.author_name}
                    </p>

                    {r.user_id === user?.id && (
                      <button
                        onClick={() => setDeleteConfirm({ show: true, id: r.id })}
                        className="review-delete-btn"
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
