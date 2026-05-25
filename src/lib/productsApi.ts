import { supabase } from "@/lib/supabaseClient";

export async function getLiveProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", "live")
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching live products:", error);
    return [];
  }
  return data || [];
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error(`Error fetching product ${slug}:`, error);
    return null;
  }
  return data;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
  return data;
}
