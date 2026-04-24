import { supabase } from "./supabaseClient";

export async function getProductRating(productId: string) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId);

    if (error) {
      console.error("Rating fetch error:", error);
      return { avg: null, count: 0 };
    }

    if (!data || data.length === 0) {
      return { avg: null, count: 0 };
    }

    const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;

    return {
      avg: avg.toFixed(1),
      count: data.length,
    };
  } catch (err) {
    console.error("Unexpected rating error:", err);
    return { avg: null, count: 0 };
  }
}
