"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import ImageWithFallback from "@/components/ImageWithFallback";
import GlobalLoader from "@/components/ui/GlobalLoader";
import { useRouter } from "next/navigation";

export default function AdminProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      // Auth check
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user || authData.user.email !== "keshvicrafts@gmail.com") {
        router.push("/");
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("priority", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    fetchProducts();
  }, [router]);

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const moveProduct = async (product: any, direction: 'up' | 'down') => {
    if (search) {
      alert("Please clear the search to reorder products.");
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
    
    setProducts(newProducts);
    
    const updates = newProducts.map((p, i) => ({
      id: p.id,
      priority: newProducts.length - i
    }));
    
    try {
      await Promise.all(updates.map(u => 
        supabase.from('products').update({ priority: u.priority }).eq('id', u.id)
      ));
    } catch (e) {
      console.error(e);
      alert("Error saving new order");
    }
  };

  if (loading) return <GlobalLoader message="Loading products..." />;

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-20 px-4">
      <div className="max-w-6xl mx-auto" style={{ paddingTop: '20px' }}>
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8 relative">
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
        <div className="flex flex-wrap gap-3 mb-8 justify-center md:justify-start">
          <Link
            href="/admin/categories"
            className="btn-primary py-2 px-5 md:py-3 md:px-6 rounded-xl font-semibold text-white shadow-sm transition-transform active:scale-95 text-xs md:text-base"
            style={{ background: "var(--brand)", textDecoration: "none", display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/products/new"
            className="btn-primary py-2 px-5 md:py-3 md:px-6 rounded-xl font-semibold text-white shadow-sm transition-transform active:scale-95 text-xs md:text-base"
            style={{ background: "var(--brand)", textDecoration: "none", display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Product
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <input
            type="text"
            placeholder="Search by name or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-3 rounded-xl bg-white focus:outline-none transition-all"
            style={{ border: '2px solid #8B7355', width: '100%', maxWidth: '700px', color: '#3E2C1C' }}
          />
        </div>

        {/* Products Grid */}
        <div className="md:hidden text-sm text-[#8B7355] mb-2 flex items-center justify-end gap-1">
          Swipe to see more <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
        </div>
        <div className="bg-white rounded-2xl border border-[#E6DCCF] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left border-collapse">
              <thead>
                <tr className="bg-[#F5EFE6] text-[#8B7355] text-[10px] md:text-sm uppercase tracking-wider">
                  <th className="p-2 md:p-4 font-semibold text-center" style={{ width: '60px' }}>Order</th>
                  <th className="p-2 md:p-4 font-semibold text-center" style={{ width: '80px' }}>Actions</th>
                  <th className="p-2 md:p-4 font-semibold" style={{ width: '70px' }}>Image</th>
                  <th className="p-2 md:p-4 font-semibold" style={{ width: '35%' }}>Product Details</th>
                  <th className="p-2 md:p-4 font-semibold" style={{ width: '20%' }}>Category</th>
                  <th className="p-2 md:p-4 font-semibold" style={{ width: '15%' }}>Price</th>
                  <th className="p-2 md:p-4 font-semibold text-center" style={{ width: '100px' }}>Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DCCF]">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 md:p-8 text-center text-[#8B7355] text-xs md:text-base">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product, idx) => {
                    const actualIndex = search ? -1 : idx;
                    const isFirst = actualIndex === 0;
                    const isLast = actualIndex === products.length - 1;
                    
                    return (
                    <tr key={product.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-2 md:p-4 text-center">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <button 
                            type="button"
                            onClick={() => moveProduct(product, 'up')}
                            style={{ background: 'none', border: 'none', cursor: (search || isFirst) ? 'not-allowed' : 'pointer', opacity: (search || isFirst) ? 0.2 : 1 }}
                            title={search ? "Clear search to reorder" : "Move Up"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5" style={{ minWidth: '16px', minHeight: '16px' }}><polyline points="18 15 12 9 6 15"></polyline></svg>
                          </button>
                          <button 
                            type="button"
                            onClick={() => moveProduct(product, 'down')}
                            style={{ background: 'none', border: 'none', cursor: (search || isLast) ? 'not-allowed' : 'pointer', opacity: (search || isLast) ? 0.2 : 1 }}
                            title={search ? "Clear search to reorder" : "Move Down"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5" style={{ minWidth: '16px', minHeight: '16px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                          </button>
                        </div>
                      </td>
                      <td className="p-2 md:p-4 text-center">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="btn-primary inline-block px-3 py-1.5 md:px-5 md:py-2 rounded-lg font-semibold text-white shadow-sm transition-transform active:scale-95 text-[10px] md:text-sm"
                          style={{ background: "var(--brand)", textDecoration: "none" }}
                        >
                          Edit
                        </Link>
                      </td>
                      <td className="p-2 md:p-4">
                        <div className="relative overflow-hidden w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-xl border border-[#E6DCCF]" style={{ minWidth: '40px', minHeight: '40px' }}>
                          <ImageWithFallback
                            src={product.images?.[0] || "/placeholder.png"}
                            alt={product.title}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      </td>
                      <td className="p-2 md:p-4">
                        <div className="font-bold md:font-semibold text-[#3E2C1C] text-xs md:text-base leading-tight md:leading-normal">{product.title}</div>
                        <div className="text-[9px] md:text-sm text-[#8B7355] mt-0.5 md:mt-0">ID: {product.id}</div>
                      </td>
                      <td className="p-2 md:p-4 text-[#5A3E2B] text-[10px] md:text-base">
                        {product.category || "-"}
                      </td>
                      <td className="p-2 md:p-4 font-medium text-[#3E2C1C] text-[10px] md:text-base">
                        ₹{product.price}
                      </td>
                      <td className="p-2 md:p-4 text-center">
                        <span className="inline-block px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[9px] md:text-xs font-bold" style={{
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
