"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { revalidateStorefront } from "@/actions/revalidate";
import Link from "next/link";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Auth check with timeout fail-safe
        const { data: authData } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
        ]).catch(() => ({ data: null }));

        if (!authData?.session?.user || authData.session.user.email !== "keshvicrafts@gmail.com") {
          router.push("/");
          return;
        }

        const { data, error } = await Promise.race([
          supabase.from("products").select("*").order("priority", { ascending: false }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
        ]).catch(err => ({ error: err }));

        if (error) {
          console.error("Error fetching products:", error);
          if (error.message === 'timeout') {
            showToast("Network timeout. Please refresh the page.");
          }
        } else {
          setProducts(data || []);
        }
      } catch (err) {
        console.error("Products fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Prevent infinite loading: if it takes over 10s, cancel loading so it doesn't spin forever.
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000);
    return () => clearTimeout(timeout);
  }, []);

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const moveProduct = async (product: any, direction: 'up' | 'down') => {
    if (search) {
      showToast("Please clear the search to reorder products.");
      return;
    }
    
    const index = products.findIndex(p => p.id === product.id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === products.length - 1) return;
    
    const newProducts = [...products];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newProducts[index];
    newProducts[index] = newProducts[swapIndex];
    newProducts[swapIndex] = temp;
    
    const updatedProducts = newProducts.map((p, i) => ({
      ...p,
      priority: newProducts.length - i
    }));
    
    setProducts(updatedProducts);
    
    try {
      await Promise.all(updatedProducts.map(u => 
        supabase.from('products').update({ priority: u.priority }).eq('id', u.id)
      ));
      await revalidateStorefront();
    } catch (e) {
      console.error(e);
      showToast("Error saving new order");
    }
  };

  const moveToPosition = async (product: any, newPosition: number) => {
    const currentIdx = products.findIndex(p => p.id === product.id);
    if (currentIdx === -1) return;
    
    let targetIdx = newPosition - 1;
    if (targetIdx < 0) targetIdx = 0;
    if (targetIdx >= products.length) targetIdx = products.length - 1;
    
    if (targetIdx === currentIdx) return;
    
    const newProducts = [...products];
    const [item] = newProducts.splice(currentIdx, 1);
    newProducts.splice(targetIdx, 0, item);
    
    const updatedProducts = newProducts.map((p, i) => ({
      ...p,
      priority: newProducts.length - i
    }));
    
    setProducts(updatedProducts);
    
    const changedUpdates = updatedProducts.filter(u => {
       const oldProd = products.find(p => p.id === u.id);
       return oldProd && oldProd.priority !== u.priority;
    });
    
    try {
      if (changedUpdates.length > 0) {
        await Promise.all(changedUpdates.map(u => 
          supabase.from('products').update({ priority: u.priority }).eq('id', u.id)
        ));
        await revalidateStorefront();
      }
    } catch (e) {
      console.error(e);
      showToast("Error saving new order");
    }
  };


  return (
    <main className="min-h-screen bg-[#FDFBF7] py-6 md:py-20 px-3 md:px-4">
      <div className="max-w-6xl mx-auto" style={{ paddingTop: '10px' }}>
        
        {/* Header */}
        <div className="flex flex-col items-center mb-4 md:mb-8 relative">
          <Link
            href="/admin"
            className="absolute left-0 p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors flex items-center justify-center"
            style={{ textDecoration: "none", top: '-4px' }}
            title="Back to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <div className="text-center px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-[#4A3219] mb-1" style={{ margin: 0, lineHeight: '1.2' }}>Products</h1>
            <p className="text-[#8B7355] text-sm md:text-base mb-3" style={{ margin: 0 }}>Manage your product catalog</p>
            <span className="text-sm font-bold text-[#4A3219] bg-[#F5EFE6] px-3 py-1 rounded-full border border-[#E6DCCF] inline-block">
              {products.length} Products
            </span>
          </div>
        </div>
        
        {/* Actions Bar */}
        <div className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-8 justify-center md:justify-start">
          <Link
            href="/admin/categories"
            className="btn-primary py-2 px-4 md:py-3 md:px-6 rounded-xl font-semibold text-sm md:text-base text-white shadow-sm transition-transform active:scale-95 flex items-center justify-center"
            style={{ background: "var(--brand)", textDecoration: "none", gap: '8px' }}
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/products/new"
            className="btn-primary py-2 px-4 md:py-3 md:px-6 rounded-xl font-semibold text-sm md:text-base text-white shadow-sm transition-transform active:scale-95 flex items-center justify-center"
            style={{ background: "var(--brand)", textDecoration: "none", gap: '8px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Product
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-4 md:mb-8 flex justify-center">
          <input
            type="text"
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 md:p-3 text-sm md:text-base rounded-xl bg-white focus:outline-none transition-all"
            style={{ border: '2px solid #8B7355', width: '100%', maxWidth: '700px', color: '#3E2C1C' }}
          />
        </div>

        {/* Products Grid */}
        <div className="md:hidden text-sm text-[#8B7355] mb-2 flex items-center justify-end gap-1">
          Swipe to see more <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </div>
        <div className="bg-[#F5EFE6] rounded-[24px] border border-[#E6DCCF] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full md:min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="bg-[#F5EFE6] text-[#8B7355] text-[10px] md:text-sm uppercase tracking-wider">
                  <th className="p-2 md:p-5 font-semibold text-center w-[40px] md:w-[60px]">Order</th>
                  <th className="p-2 md:p-5 font-semibold w-[50px] md:w-[80px]">Image</th>
                  <th className="p-2 md:p-5 font-semibold md:w-[220px]">Product Details</th>
                  <th className="p-2 md:p-5 font-semibold text-center w-[70px] md:w-[140px]">Actions</th>
                  <th className="hidden md:table-cell p-4 md:p-5 font-semibold w-[140px]">Category</th>
                  <th className="hidden md:table-cell p-4 md:p-5 font-semibold w-[100px]">Price</th>
                  <th className="hidden md:table-cell p-4 md:p-5 font-semibold text-center w-[100px]">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DCCF]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-16 text-center">
                      <div className="w-10 h-10 rounded-full border-4 border-[#4A3219] border-t-transparent animate-spin mx-auto mb-4"></div>
                      <div className="text-[#8B7355] font-semibold text-lg">Loading catalog...</div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <div className="text-[#8B7355] font-semibold text-lg">
                        {search ? "No products match your search." : "No products found. Add one above!"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, idx) => {
                    const actualIndex = search ? -1 : idx;
                    const isFirst = actualIndex === 0;
                    const isLast = actualIndex === products.length - 1;
                    
                    return (
                    <tr key={product.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-1 md:p-5 text-center">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '2px' }}>
                          <button 
                            type="button"
                            onClick={() => moveProduct(product, 'up')}
                            style={{ background: 'none', border: 'none', padding: 0, display: 'flex', justifyContent: 'center', cursor: (search || isFirst) ? 'not-allowed' : 'pointer', opacity: (search || isFirst) ? 0.2 : 1 }}
                            title={search ? "Clear search to reorder" : "Move Up"}
                            disabled={!!search}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                          </button>
                          
                          <input 
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            disabled={!!search}
                            title={search ? "Clear search to reorder" : "Set exact position"}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val !== actualIndex + 1) {
                                moveToPosition(product, val);
                              } else {
                                e.target.value = (actualIndex + 1).toString();
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="text-sm font-semibold text-[#4A3219] p-0 m-0 disabled:opacity-50"
                            style={{ 
                              MozAppearance: 'textfield', 
                              WebkitAppearance: 'none',
                              border: 'none',
                              background: 'transparent',
                              outline: 'none',
                              boxShadow: 'none',
                              width: '40px',
                              textAlign: 'center'
                            }}
                            key={`input-${product.id}-${actualIndex}`}
                            defaultValue={actualIndex + 1}
                          />

                          <button 
                            type="button"
                            onClick={() => moveProduct(product, 'down')}
                            style={{ background: 'none', border: 'none', padding: 0, display: 'flex', justifyContent: 'center', cursor: (search || isLast) ? 'not-allowed' : 'pointer', opacity: (search || isLast) ? 0.2 : 1 }}
                            title={search ? "Clear search to reorder" : "Move Down"}
                            disabled={!!search}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </button>
                        </div>
                      </td>
                      <td className="p-2 md:p-5">
                        <div className="relative overflow-hidden flex-shrink-0" style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '10px', border: '1px solid #E6DCCF' }}>
                          <ImageWithFallback
                            src={product.images?.[0] || "/placeholder.png"}
                            alt={product.title}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      </td>
                      <td className="p-2 md:p-5">
                        <div className="font-semibold text-xs md:text-sm text-[#3E2C1C] leading-tight mb-1">{product.title}</div>
                        <div className="text-[10px] md:text-xs text-[#8B7355] truncate max-w-[100px] md:max-w-none">ID: {product.id}</div>
                      </td>
                      <td className="p-1 md:p-5 text-center">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="btn-primary inline-block px-3 py-1.5 md:px-5 md:py-2 rounded-lg font-semibold text-white shadow-sm transition-transform active:scale-95"
                          style={{ background: "var(--brand)", textDecoration: "none", fontSize: '0.75rem' }}
                        >
                          Edit
                        </Link>
                      </td>
                      <td className="hidden md:table-cell p-4 md:p-5 text-xs md:text-sm text-[#5A3E2B]">
                        {product.category || "-"}
                      </td>
                      <td className="hidden md:table-cell p-4 md:p-5 text-xs md:text-sm font-medium text-[#3E2C1C]">
                        ₹{product.price}
                      </td>
                      <td className="p-4 md:p-5 text-center">
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          ...(product.stock > 0 
                            ? { backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' } 
                            : { backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' })
                        }}>
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
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
