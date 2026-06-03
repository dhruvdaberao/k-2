import { supabase } from "@/lib/supabaseClient";

function mapProduct(p: any) {
  if (!p) return p;
  const homeSectionTag = p.tags?.find((t: string) => t.startsWith('_homeSection:'));
  return {
    ...p,
    homeSection: p.homeSection || (homeSectionTag ? homeSectionTag.split(':')[1] : 'none'),
    stock: typeof p.stock === 'number' ? (p.stock > 0 ? 1 : 0) : p.stock
  };
}

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
  return (data || []).map(mapProduct);
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
  return mapProduct(data);
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
  return mapProduct(data);
}
