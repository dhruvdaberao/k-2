"use client";

import { supabase } from "./supabaseClient";

type RatingEntry = { avg: string | null; count: number };

// In-memory cache — survives client-side navigation
let ratingCache: Map<string, RatingEntry> = new Map();
let fetchPromise: Promise<void> | null = null;
let cacheReady = false;

// Use localStorage (persists across app restarts) instead of sessionStorage
const CACHE_KEY = "kc:ratings";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function hydrateFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }
    const entries: [string, RatingEntry][] = data;
    ratingCache = new Map(entries);
    cacheReady = true;
  } catch {
    // Ignore parse errors
  }
}

function persistToStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ data: Array.from(ratingCache.entries()), ts: Date.now() })
    );
  } catch {
    // Ignore storage errors
  }
}

/**
 * Fetches ALL ratings from the reviews table in a single query and caches them.
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

    const aggregated = new Map<string, { sum: number; count: number }>();

    for (const row of data || []) {
      const pid = row.product_id;
      const entry = aggregated.get(pid) || { sum: 0, count: 0 };
      entry.sum += row.rating;
      entry.count += 1;
      aggregated.set(pid, entry);
    }

    for (const [pid, { sum, count }] of aggregated) {
      ratingCache.set(pid, {
        avg: (sum / count).toFixed(1),
        count,
      });
    }

    cacheReady = true;
    persistToStorage();
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

  // Try localStorage first (persists across app restarts!)
  hydrateFromStorage();
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
 * SYNCHRONOUS: Get a single product's rating from cache.
 * Returns { avg: null, count: -1 } if cache is not ready (loading).
 * Returns { avg: null, count: 0 } if product has no reviews.
 */
export function getCachedRating(productId: string): RatingEntry {
  // Try hydrating from localStorage synchronously on first call
  if (!cacheReady) {
    hydrateFromStorage();
  }
  if (!cacheReady) return { avg: null, count: -1 }; // -1 = loading
  return ratingCache.get(productId) || { avg: null, count: 0 };
}

/**
 * Invalidate cache — call after submitting/deleting a review.
 */
export function invalidateRatingCache() {
  ratingCache.clear();
  cacheReady = false;
  fetchPromise = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem(CACHE_KEY);
  }
}

export function injectInitialRatings(ratingsMap: Record<string, RatingEntry>) {
  for (const [key, val] of Object.entries(ratingsMap)) {
    ratingCache.set(key, val);
  }
  cacheReady = true;
}
