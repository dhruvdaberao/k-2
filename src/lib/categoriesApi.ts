import { supabase } from "./supabaseClient";

export interface Category {
  id: string;
  name: string;
  slug: string;
  priority: number;
  image_url?: string;
}

/**
 * Fetch all categories ordered by priority (highest first)
 */
export async function getLiveCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("priority", { ascending: false });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
  return data || [];
}

/**
 * Update the priority of a single category
 */
export async function updateCategoryPriority(id: string, priority: number): Promise<boolean> {
  const { error } = await supabase
    .from("categories")
    .update({ priority })
    .eq("id", id);
    
  if (error) {
    console.error("Error updating category priority:", error);
    return false;
  }
  return true;
}

/**
 * Add a new category
 */
export async function addCategory(name: string, image_url?: string): Promise<boolean> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  const { error } = await supabase
    .from("categories")
    .insert([
      { name, slug, image_url }
    ]);
    
  if (error) {
    console.error("Error adding category:", error);
    return false;
  }
  return true;
}

/**
 * Update a category (name and image_url)
 * Also updates associated products if the name changes
 */
export async function updateCategory(id: string, newName: string, newImageUrl?: string, oldName?: string): Promise<boolean> {
  const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const updateData: any = { name: newName, slug };
  if (newImageUrl !== undefined) {
    updateData.image_url = newImageUrl;
  }

  const { error } = await supabase
    .from("categories")
    .update(updateData)
    .eq("id", id);
    
  if (error) {
    console.error("Error updating category:", error);
    return false;
  }

  // Update associated products if name changed
  if (oldName && oldName !== newName) {
    const { error: productsError } = await supabase
      .from("products")
      .update({ category: newName })
      .eq("category", oldName);
      
    if (productsError) {
      console.error("Error updating associated products:", productsError);
    }
  }

  return true;
}

/**
 * Delete a category and fallback its products to 'Bags'
 */
export async function deleteCategory(id: string, name: string): Promise<boolean> {
  // Update all products in this category to 'Bags'
  const { error: updateError } = await supabase
    .from("products")
    .update({ category: "Bags" })
    .eq("category", name);

  if (updateError) {
    console.error("Error falling back products to Bags:", updateError);
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);
    
  if (error) {
    console.error("Error deleting category:", error);
    return false;
  }
  return true;
}
