"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import ImageWithFallback from "@/components/ImageWithFallback";
import GlobalLoader from "@/components/ui/GlobalLoader";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { showToast } from "@/components/Toast";
import { getLiveCategories, Category } from "@/lib/categoriesApi";
import imageCompression from "browser-image-compression";

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    slug: initialData?.slug || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    category: initialData?.category || "",
    stock: initialData?.stock || 0,
    variants: initialData?.variants || null,
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    getLiveCategories().then(data => {
      setCategories(data);
      if (!formData.category && data.length > 0) {
        setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    });
  }, []);
  
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number = value;
    if (type === "number") finalValue = parseFloat(value) || 0;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: finalValue };
      if (name === "title" && !isEdit) {
        // Auto-generate ID and Slug if new
        const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        updated.id = slug;
        updated.slug = slug;
      }
      return updated;
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    setUploadingImages(true);

    try {
      const uploadedUrls: string[] = [];
      const productId = formData.id || 'temp_' + Date.now();

      for (const file of files) {
        let compressedFile = file;
        try {
          const options = {
            maxSizeMB: 0.2, // Target ~200KB
            maxWidthOrHeight: 1080, // Restrict dimensions for web
            useWebWorker: true,
            initialQuality: 0.8
          };
          compressedFile = await imageCompression(file, options);
          console.log(`Compressed from ${(file.size/1024).toFixed(1)}KB to ${(compressedFile.size/1024).toFixed(1)}KB`);
        } catch (error) {
          console.error("Compression failed, using original file", error);
        }

        const fileExt = compressedFile.name.split('.').pop() || 'jpg';
        const fileName = `${productId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, compressedFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          showToast(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(publicUrl);
      }

      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      console.error(err);
      showToast("An error occurred during upload.");
    } finally {
      setUploadingImages(false);
      e.target.value = ''; // reset input
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Drag and Drop Logic for Images
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null) return;
    
    const newImages = [...images];
    const draggedImg = newImages[draggedIdx];
    newImages.splice(draggedIdx, 1);
    newImages.splice(index, 0, draggedImg);
    
    setImages(newImages);
    setDraggedIdx(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.title) {
      showToast("ID and Title are required.");
      return;
    }

    setLoading(true);
    
    // Automatically map images to variants if variants exist
    let updatedVariants = formData.variants;
    if (updatedVariants && Array.isArray(updatedVariants) && updatedVariants.length > 0) {
      updatedVariants = updatedVariants.map((variant: any, idx: number) => {
        if (images[idx]) {
          return { ...variant, images: [images[idx]] };
        }
        return variant;
      });
    }

    const productPayload = {
      ...formData,
      variants: updatedVariants,
      images,
      status: 'live'
    };

    const { error } = await supabase
      .from('products')
      .upsert(productPayload);

    setLoading(false);

    if (error) {
      console.error(error);
      showToast("Failed to save product: " + error.message);
    } else {
      showToast(isEdit ? "Product updated successfully ✓" : "Product added successfully ✓");
      router.push("/admin/products");
      router.refresh();
    }
  };

  const executeDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    const { error } = await supabase.from('products').delete().eq('id', formData.id);
    setLoading(false);
    
    if (error) {
      console.error(error);
      showToast("Failed to delete product: " + error.message);
    } else {
      showToast("Product deleted successfully");
      router.push("/admin/products");
      router.refresh();
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8 bg-white p-3 md:p-8 rounded-2xl border border-[#E6DCCF] shadow-sm">
      {loading && <GlobalLoader message="Saving Product..." />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left Column: Details */}
        <div className="space-y-4">
          <h2 className="text-base md:text-xl font-bold text-[#4A3219] mb-2 md:mb-4 border-b border-[#E6DCCF] pb-1 md:pb-2">Product Details</h2>
          
          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-1">Product Title</label>
            <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#E6DCCF] focus:outline-none focus:ring-2 focus:ring-[#8B7355]" placeholder="e.g. Handmade Crochet Tulip" />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#8B7355] mb-1">Product ID (Slug)</label>
              <input type="text" name="id" required value={formData.id} onChange={handleInputChange} disabled={isEdit} className={`w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#E6DCCF] ${isEdit ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-[#8B7355]'}`} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#8B7355] mb-1">Category</label>
              <div className="relative">
                <div 
                  className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#E6DCCF] bg-white cursor-pointer flex justify-between items-center text-[#3E2C1C]"
                  style={{ outline: dropdownOpen ? '2px solid #8B7355' : 'none', minHeight: '42px' }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span>{formData.category || "Select a category"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                    <div className="absolute z-20 w-full mt-2 bg-white border border-[#E6DCCF] rounded-xl shadow-lg max-h-60 overflow-y-auto" style={{ top: '100%' }}>
                      {categories.map(c => (
                        <div 
                          key={c.id} 
                          className="px-4 py-3 hover:bg-[#F5EFE6] cursor-pointer text-[#3E2C1C] transition-colors"
                          style={{ backgroundColor: formData.category === c.name ? '#FDFBF7' : 'transparent', fontWeight: formData.category === c.name ? 'bold' : 'normal' }}
                          onClick={() => {
                            setFormData(prev => ({ ...prev, category: c.name }));
                            setDropdownOpen(false);
                          }}
                        >
                          {c.name}
                        </div>
                      ))}
                      {categories.length === 0 && (
                        <div className="px-4 py-3 text-sm text-[#8B7355] italic">No categories found.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

            <div>
              <label className="block text-sm font-semibold text-[#8B7355] mb-1">Description</label>
              <textarea 
                name="description" 
                required 
                value={formData.description} 
                onChange={(e) => {
                  handleInputChange(e);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }} 
                className="w-full p-3 rounded-xl border border-[#E6DCCF] focus:outline-none focus:ring-2 focus:ring-[#8B7355] bg-white resize-none overflow-hidden" 
                rows={3}
                style={{ minHeight: '80px' }}
                placeholder="Describe your product..."
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
              />
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#8B7355] mb-1">Price (₹)</label>
              <input type="number" name="price" required min="0" value={formData.price} onChange={handleInputChange} className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#E6DCCF] focus:outline-none focus:ring-2 focus:ring-[#8B7355]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#8B7355] mb-2">Stock Status</label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                <div style={{ position: 'relative', width: '56px', height: '32px' }}>
                  <input
                    type="checkbox"
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    checked={formData.stock > 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.checked ? 999 : 0 }))}
                  />
                  {/* Track */}
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    borderRadius: '34px', transition: 'background-color 0.3s',
                    backgroundColor: formData.stock > 0 ? '#4A3219' : '#E6DCCF'
                  }}></div>
                  {/* Thumb */}
                  <div style={{
                    position: 'absolute', top: '4px', left: '4px', 
                    width: '24px', height: '24px', borderRadius: '50%', 
                    backgroundColor: 'white', transition: 'transform 0.3s',
                    transform: formData.stock > 0 ? 'translateX(24px)' : 'translateX(0)'
                  }}></div>
                </div>
                <div style={{ fontWeight: '600', color: formData.stock > 0 ? '#4A3219' : '#8B7355' }}>
                  {formData.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Images */}
        <div className="space-y-4">
          <h2 className="text-base md:text-xl font-bold text-[#4A3219] mb-2 md:mb-4 border-b border-[#E6DCCF] pb-1 md:pb-2">Images</h2>
          
          <div 
            style={{ 
              backgroundColor: '#F5EFE6', 
              padding: '20px', 
              borderRadius: '12px', 
              border: '2px dashed #d2c4b3', 
              textAlign: 'center', 
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FDFBF7';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.05)';
              e.currentTarget.style.borderColor = '#8B7355';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F5EFE6';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#d2c4b3';
            }}
          >
            <input type="file" id="image-upload" multiple accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            <label htmlFor="image-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', height: '100%' }}>
              <div style={{ backgroundColor: '#4A3219', padding: '16px', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(74, 50, 25, 0.3)', transition: 'transform 0.2s ease' }}
                   onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
              <span style={{ fontWeight: 'bold', color: '#4A3219', fontSize: '1.125rem', marginTop: '4px' }}>Add New Images</span>
              <span style={{ fontSize: '0.875rem', color: '#8B7355' }}>PNG, JPG up to 5MB</span>
            </label>
          </div>

          {uploadingImages && (
            <div className="mt-4 p-4 rounded-xl border border-[#E6DCCF] bg-[#FDFBF7]">
              <div className="flex justify-between text-sm font-semibold text-[#4A3219] mb-2">
                <span>Uploading images...</span>
                <span className="animate-pulse text-[#8B7355]">Processing</span>
              </div>
              <div className="w-full h-2 bg-[#E6DCCF] rounded-full overflow-hidden relative">
                <div className="absolute top-0 bottom-0 left-0 bg-[#4A3219] rounded-full" style={{ animation: 'loadingBar 1.5s infinite ease-in-out' }}></div>
              </div>
              <style>{`
                @keyframes loadingBar {
                  0% { left: -50%; width: 30%; }
                  50% { width: 50%; }
                  100% { left: 100%; width: 30%; }
                }
              `}</style>
            </div>
          )}

          {images.length > 0 && (
            <div>
              <p className="text-xs text-[#8B7355] mb-2 font-semibold">Drag to reorder (Primary image first)</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                {images.map((img, idx) => (
                  <div
                    key={img}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className="group"
                    style={{
                      position: 'relative',
                      width: '100%',
                      paddingBottom: '100%', /* 1:1 Aspect Ratio */
                      borderRadius: '12px',
                      border: '1px solid #E6DCCF',
                      overflow: 'hidden',
                      cursor: 'move',
                      backgroundColor: 'white',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <ImageWithFallback src={img} alt={`Preview ${idx}`} fill style={{ objectFit: 'cover' }} />
                    
                    {/* Number Circle */}
                    <div style={{ 
                      position: 'absolute', top: '6px', left: '6px', 
                      backgroundColor: '#4A3219', color: '#ffffff', 
                      width: '24px', height: '24px', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      borderRadius: '50%', fontSize: '12px', fontWeight: 'bold', 
                      border: '2px solid white', zIndex: 10 
                    }}>
                      {idx + 1}
                    </div>

                    {idx === 0 && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        backgroundColor: 'rgba(74, 50, 25, 0.9)', color: 'white',
                        fontSize: '10px', fontWeight: 'bold', textAlign: 'center', padding: '4px 0', zIndex: 10
                      }}>
                        MAIN COVER
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute', top: '6px', right: '6px',
                        backgroundColor: 'rgba(255,255,255,0.9)', color: '#ef4444',
                        width: '24px', height: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%', padding: '0', border: 'none', cursor: 'pointer', zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      title="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 md:pt-8 mt-4 md:mt-8 border-t border-[#E6DCCF] flex flex-wrap gap-3 md:gap-4">
        <button type="submit" className="btn-primary px-5 py-2 md:px-8 md:py-3 rounded-xl text-sm md:text-base font-bold text-white shadow-sm transition-transform active:scale-95" style={{ background: "var(--brand)" }}>
          {isEdit ? "Update Product" : "Save New Product"}
        </button>
        
        <button type="button" onClick={() => router.back()} className="btn-primary px-5 py-2 md:px-8 md:py-3 rounded-xl text-sm md:text-base font-bold text-white shadow-sm transition-transform active:scale-95" style={{ background: "var(--brand)" }}>
          Cancel
        </button>

        {isEdit && (
          <button 
            type="button" 
            onClick={handleDelete} 
            className="btn px-5 py-2 md:px-8 md:py-3 rounded-xl text-sm md:text-base font-bold text-white shadow-sm transition-transform active:scale-95" 
            style={{ backgroundColor: "#ef4444", color: "#ffffff", border: "none" }}
          >
            Delete Product
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        destructive={true}
        onConfirm={executeDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </form>
  );
}
