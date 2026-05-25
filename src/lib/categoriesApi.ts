import { supabase } from "./supabaseClient";

export interface Category {
  id: string;
  name: string;
  slug: string;
  priority: number;
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
export async function addCategory(name: string): Promise<boolean> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  const { error } = await supabase
    .from("categories")
    .insert([
      { name, slug }
    ]);
    
  if (error) {
    console.error("Error adding category:", error);
    return false;
  }
  return true;
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<boolean> {
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
