import { supabase } from "@/lib/supabaseClient";
import { getLiveCategories, Category } from "./categoriesApi";
import { calculateDiscountInfo } from "./discounts";

export async function mapProduct(p: any, categories?: Category[]) {
  if (!p) return p;
  const homeSectionTag = p.tags?.find((t: string) => t.startsWith('_homeSection:'));
  
  let mappedProduct = {
    ...p,
    homeSection: p.homeSection || (homeSectionTag ? homeSectionTag.split(':')[1] : 'none'),
    stock: typeof p.stock === 'number' ? (p.stock > 0 ? 1 : 0) : p.stock
  };

  if (categories) {
    const discountInfo = calculateDiscountInfo(mappedProduct, categories);
    if (discountInfo.isActive) {
      mappedProduct.original_price = discountInfo.originalPrice;
      mappedProduct.price = discountInfo.effectivePrice;
      mappedProduct.discount_badge = `${discountInfo.discountPercentage}% OFF`;
    }
  }

  return mappedProduct;
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
  
  const categories = await getLiveCategories();
  
  return Promise.all((data || []).map((p: any) => mapProduct(p, categories)));
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
  
  const categories = await getLiveCategories();
  return mapProduct(data, categories);
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
  
  const categories = await getLiveCategories();
  return mapProduct(data, categories);
}
