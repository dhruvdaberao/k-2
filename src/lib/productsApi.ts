import { supabase } from "@/lib/supabaseClient";

export async function getLiveProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, title, description, price, images, category, stock, status, badge, badges, priority, tags, type, priceBucket, minPrice, priceLabel, shippingCharge, deliveryTime, returnPolicy, materials, dimensions, handcraftedHours, checkoutUrl, cta, carts, isVariant, variants, seoContent")
    .eq("status", "live")
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching live products:", error);
    return [];
  }
  return (data || []).map((p: any) => ({
    ...p,
    stock: typeof p.stock === 'number' ? (p.stock > 0 ? 1 : 0) : p.stock
  }));
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, title, description, price, images, category, stock, status, badge, badges, priority, tags, type, priceBucket, minPrice, priceLabel, shippingCharge, deliveryTime, returnPolicy, materials, dimensions, handcraftedHours, checkoutUrl, cta, carts, isVariant, variants, seoContent")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error(`Error fetching product ${slug}:`, error);
    return null;
  }
  if (data) {
    data.stock = typeof data.stock === 'number' ? (data.stock > 0 ? 1 : 0) : data.stock;
  }
  return data;
}

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("id, slug, title, description, price, images, category, stock, status, badge, badges, priority, tags, type, priceBucket, minPrice, priceLabel, shippingCharge, deliveryTime, returnPolicy, materials, dimensions, handcraftedHours, checkoutUrl, cta, carts, isVariant, variants, seoContent")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
  if (data) {
    data.stock = typeof data.stock === 'number' ? (data.stock > 0 ? 1 : 0) : data.stock;
  }
  return data;
}
