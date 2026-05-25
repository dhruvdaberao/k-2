"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import GlobalLoader from "@/components/ui/GlobalLoader";
import { useRouter } from "next/navigation";
import { getLiveCategories, addCategory, deleteCategory, Category } from "@/lib/categoriesApi";
import { showToast } from "@/components/Toast";

export default function AdminCategories() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Auth check
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user || authData.user.email !== "keshvicrafts@gmail.com") {
          router.push("/");
          return;
        }

        const data = await getLiveCategories();
        setCategories(data);
      } catch (err) {
        console.error("Categories fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    // Safety: never show loading for more than 5 seconds
    const safety = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(safety);
  }, [router]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    const success = await addCategory(newCategoryName.trim());
    
    if (success) {
      showToast("Category added successfully");
      setNewCategoryName("");
      const data = await getLiveCategories();
      setCategories(data);
    } else {
      showToast("Failed to add category. It may already exist.");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? This action cannot be undone.`)) return;
    
    const success = await deleteCategory(id, name);
    if (success) {
      showToast("Category deleted");
      setCategories(categories.filter(c => c.id !== id));
    } else {
      showToast("Failed to delete category");
    }
  };

  const moveCategory = async (category: Category, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === category.id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;
    
    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newCategories[index];
    newCategories[index] = newCategories[swapIndex];
    newCategories[swapIndex] = temp;
    
    setCategories(newCategories);
    
    const updates = newCategories.map((c, i) => ({
      id: c.id,
      priority: newCategories.length - i
    }));
    
    try {
      await Promise.all(updates.map(u => 
        supabase.from('categories').update({ priority: u.priority }).eq('id', u.id)
      ));
    } catch (e) {
      console.error(e);
      showToast("Error saving new order");
    }
  };

  if (loading) return <GlobalLoader message="Loading categories..." />;

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-10 md:py-20 px-3 md:px-4">
      <div className="max-w-4xl mx-auto" style={{ paddingTop: '10px' }}>
        
        {/* Header */}
        <div className="flex flex-col items-center mb-4 md:mb-8 relative">
          <Link
            href="/admin/products"
            className="absolute left-0 p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors flex items-center justify-center"
            style={{ textDecoration: "none", top: '-4px' }}
            title="Back to Products"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <div className="text-center px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-[#4A3219] mb-1" style={{ margin: 0, lineHeight: '1.2' }}>Categories</h1>
            <p className="text-[#8B7355] text-sm md:text-base mb-3" style={{ margin: 0 }}>Manage your product categories</p>
            <span className="text-sm font-bold text-[#4A3219] bg-[#F5EFE6] px-3 py-1 rounded-full border border-[#E6DCCF] inline-block">
              {categories.length} Categories
            </span>
          </div>
        </div>

        {/* Add Category Form */}
        <div className="bg-white p-3 md:p-6 rounded-2xl border border-[#E6DCCF] shadow-sm mb-4 md:mb-8">
          <h2 className="text-base md:text-xl font-bold text-[#4A3219] mb-3 md:mb-4">Add New Category</h2>
          <form onSubmit={handleAddCategory} className="flex flex-col gap-2">
            <label className="block text-sm font-semibold text-[#8B7355]">Category Name</label>
            <div className="flex flex-wrap gap-4 items-center">
              <input 
                type="text" 
                required 
                value={newCategoryName} 
                onChange={(e) => setNewCategoryName(e.target.value)} 
                className="p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#E6DCCF] focus:outline-none focus:ring-2 focus:ring-[#8B7355]" 
                placeholder="e.g. Special Edition" 
                style={{ flex: '1 1 200px', maxWidth: '100%' }}
              />
              <button 
                type="submit" 
                disabled={isSubmitting || !newCategoryName.trim()}
                className="btn-primary px-5 md:px-8 rounded-xl font-bold text-sm md:text-base text-white shadow-sm transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center" 
                style={{ background: "var(--brand)", height: "40px", flex: '0 0 auto' }}
              >
                {isSubmitting ? "Adding..." : "Add Category"}
              </button>
            </div>
          </form>
        </div>

        {/* Categories Grid */}
        <div className="bg-white rounded-2xl border border-[#E6DCCF] shadow-sm" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full text-left border-collapse" style={{ minWidth: '500px' }}>
              <thead>
                <tr className="bg-[#F5EFE6] text-[#8B7355] text-xs md:text-sm uppercase tracking-wider">
                  <th className="p-2 md:p-4 font-semibold text-center" style={{ width: '80px' }}>Order</th>
                  <th className="p-2 md:p-4 font-semibold">Category Name</th>
                  <th className="p-2 md:p-4 font-semibold">Slug (URL)</th>
                  <th className="p-2 md:p-4 font-semibold text-center" style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DCCF]">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#8B7355]">
                      No categories found. Add one above!
                    </td>
                  </tr>
                ) : (
                  categories.map((category, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === categories.length - 1;
                    
                    return (
                    <tr key={category.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-2 md:p-4 text-center">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <button 
                            type="button"
                            onClick={() => moveCategory(category, 'up')}
                            style={{ background: 'none', border: 'none', cursor: isFirst ? 'not-allowed' : 'pointer', opacity: isFirst ? 0.2 : 1 }}
                            title="Move Up"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                          </button>
                          <button 
                            type="button"
                            onClick={() => moveCategory(category, 'down')}
                            style={{ background: 'none', border: 'none', cursor: isLast ? 'not-allowed' : 'pointer', opacity: isLast ? 0.2 : 1 }}
                            title="Move Down"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </button>
                        </div>
                      </td>
                      <td className="p-2 md:p-4 text-xs md:text-sm font-semibold text-[#3E2C1C]">
                        {category.name}
                      </td>
                      <td className="p-2 md:p-4 text-xs md:text-sm text-[#8B7355]">
                        {category.slug}
                      </td>
                      <td className="p-2 md:p-4 text-center">
                        <button
                          onClick={() => {
                            if (category.name.toLowerCase() === "bags") {
                              showToast("The 'Bags' category is a default system category and cannot be deleted.");
                              return;
                            }
                            handleDelete(category.id, category.name);
                          }}
                          className={`transition-opacity flex items-center justify-center p-2 rounded-lg mx-auto ${category.name.toLowerCase() === 'bags' ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-70 cursor-pointer'}`}
                          style={{ background: 'transparent', border: 'none', color: category.name.toLowerCase() === 'bags' ? '#9ca3af' : '#ef4444' }}
                          title={category.name.toLowerCase() === 'bags' ? "Default System Category" : "Delete Category"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
