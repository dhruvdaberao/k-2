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
  try {
    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token || "";

    const response = await fetch('/api/admin/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        action: 'updatePriority',
        payload: [{ id, priority }]
      })
    });
    
    const result = await response.json();
    return !!result.success;
  } catch (error) {
    console.error("Error updating category priority:", error);
    return false;
  }
}

/**
 * Add a new category
 */
export async function addCategory(name: string, image_url?: string): Promise<boolean> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  try {
    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token || "";

    const response = await fetch('/api/admin/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        action: 'insert',
        payload: { name, slug, image_url }
      })
    });
    
    const result = await response.json();
    return !!result.success;
  } catch (error) {
    console.error("Error adding category:", error);
    return false;
  }
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

  try {
    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token || "";

    const response = await fetch('/api/admin/catalog/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        action: 'update',
        payload: { id, data: updateData, oldName }
      })
    });
    
    const result = await response.json();
    return !!result.success;
  } catch (error) {
    console.error("Error updating category:", error);
    return false;
  }
}

/**
 * Delete a category and fallback its products to 'Bags'
 */
export async function deleteCategory(id: string, name: string): Promise<boolean> {
  try {
    const { data: authData } = await supabase.auth.getSession();
    const token = authData.session?.access_token || "";

    const response = await fetch(`/api/admin/catalog/categories?id=${id}&name=${encodeURIComponent(name)}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    return !!result.success;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
}
