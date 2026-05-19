"use client";

import { supabase } from "./supabaseClient";

type RatingEntry = { avg: string | null; count: number };

// In-memory cache — survives client-side navigation, cleared on full reload
let ratingCache: Map<string, RatingEntry> = new Map();
let fetchPromise: Promise<void> | null = null;
let cacheReady = false;

// Session storage key for persistence across soft navigations
const CACHE_KEY = "kc:ratings";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function hydrateFromSession() {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return;
    }
    const entries: [string, RatingEntry][] = data;
    ratingCache = new Map(entries);
    cacheReady = true;
  } catch {
    // Ignore parse errors
  }
}

function persistToSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data: Array.from(ratingCache.entries()), ts: Date.now() })
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetches ALL ratings from the reviews table in a single query and caches them.
 * This replaces N individual getProductRating() calls with 1 batch query.
 */
async function fetchAllRatings(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("product_id, rating");

    if (error) {
      console.error("[RatingCache] Fetch error:", error.message);
      return;
    }

    // Aggregate ratings per product
    const aggregated = new Map<string, { sum: number; count: number }>();

    for (const row of data || []) {
      const pid = row.product_id;
      const entry = aggregated.get(pid) || { sum: 0, count: 0 };
      entry.sum += row.rating;
      entry.count += 1;
      aggregated.set(pid, entry);
    }

    // Convert to RatingEntry format
    for (const [pid, { sum, count }] of aggregated) {
      ratingCache.set(pid, {
        avg: (sum / count).toFixed(1),
        count,
      });
    }

    cacheReady = true;
    persistToSession();
  } catch (err) {
    console.error("[RatingCache] Unexpected error:", err);
  }
}

/**
 * Ensures the cache is populated. Only triggers one fetch even if called
 * concurrently from multiple ProductCard components.
 */
export async function ensureRatingsLoaded(): Promise<void> {
  if (cacheReady) return;

  // Try session storage first
  hydrateFromSession();
  if (cacheReady) return;

  // Deduplicate concurrent calls
  if (!fetchPromise) {
    fetchPromise = fetchAllRatings().finally(() => {
      fetchPromise = null;
    });
  }

  await fetchPromise;
}

/**
 * Get a single product's rating from the cache.
 * Returns { avg: null, count: -1 } if cache is not ready yet (loading state).
 * Returns { avg: null, count: 0 } if product has no reviews.
 */
export function getCachedRating(productId: string): RatingEntry {
  if (!cacheReady) return { avg: null, count: -1 }; // -1 = loading
  return ratingCache.get(productId) || { avg: null, count: 0 };
}

/**
 * Invalidate cache — call after submitting/deleting a review.
 * Next getCachedRating call will trigger a fresh fetch.
 */
export function invalidateRatingCache() {
  ratingCache.clear();
  cacheReady = false;
  fetchPromise = null;
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(CACHE_KEY);
  }
}
