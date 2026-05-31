"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { revalidateStorefront, revalidateAdmin } from "@/actions/revalidate";
import { showToast } from "@/components/Toast";
import { updateCategory } from "@/lib/categoriesApi";
import imageCompression from "browser-image-compression";

export default function EditCategory({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    image_url: "",
  });
  const [originalName, setOriginalName] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCategory();
  }, []);

  const fetchCategory = async () => {
    try {
      const { data, error } = await supabase.from("categories").select("*").eq("id", params.id).single();
      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          image_url: data.image_url || "",
        });
        setOriginalName(data.name);
        setImagePreview(data.image_url || null);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load category");
      router.push("/admin/categories");
    } finally {
      setLoading(false);
    }
  };

  const processFile = (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    processFile(e.target.files[0]);
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        if ((activeEl as HTMLInputElement).type !== 'file') return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf("image") === 0) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            processFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handlePasteClick = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: imageType });
          processFile(file);
          return;
        }
      }
      showToast("No image found in clipboard");
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      showToast("Please allow clipboard permissions or use Ctrl+V");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast("Category name is required");
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = formData.image_url;

      // 1. Upload new image if provided
      if (imageFile) {
        let compressedFile = imageFile;
        try {
          const options = {
            maxSizeMB: 1.5,
            maxWidthOrHeight: 1920,
            useWebWorker: false, 
            initialQuality: 0.9,
            maxIteration: 10
          };
          compressedFile = await imageCompression(imageFile, options);
        } catch (error) {
          console.error("Compression failed, using original file", error);
        }

        const ext = compressedFile.name.split(".").pop() || 'jpg';
        const fileName = `${Date.now()}_cat_${Math.random().toString(36).substring(2, 9)}.${ext}`;
        
        const { error: uploadError } = await Promise.race([
          supabase.storage
            .from("product-images")
            .upload(fileName, compressedFile, {
              cacheControl: "3600",
              upsert: false,
            }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000))
        ]).catch(err => ({ error: err }));

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      // Update category using the API
      const success = await updateCategory(
        params.id, 
        formData.name.trim(), 
        finalImageUrl, 
        originalName
      );

      if (!success) {
        throw new Error("Failed to save category");
      }

      await revalidateStorefront();
      await revalidateAdmin();
      showToast(`Category updated successfully!`);
      router.refresh();
      setTimeout(() => router.push("/admin/categories"), 1000);
      
    } catch (err: any) {
      console.error(err);
      if (err.message === 'timeout') {
        showToast("Upload timed out. Please try saving again.");
      } else {
        showToast(err.message || "Failed to save category");
      }
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <header className="flex items-center gap-4 mb-8">
            <Link
              href="/admin/categories"
              className="p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#4A3219]">Edit Category</h1>
            </div>
          </header>
          <div className="flex justify-center items-center py-32">
            <div className="w-12 h-12 rounded-full border-4 border-stone-200 border-t-[#4A3219] animate-spin"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/categories"
            className="p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#4A3219]">Edit Category</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} noValidate className="max-w-[400px] mx-auto flex flex-col items-center">
          {/* Image Upload */}
          <div className="mb-8 w-full flex flex-col items-center">
            <h3 className="font-bold text-[#4A3219] mb-2 text-lg md:text-xl border-b border-[#C4A484] pb-2 text-center inline-block">Category Image</h3>
            <p className="text-xs text-[#8B7355] mb-4 text-center">This image will be displayed on the homepage collection circles.</p>
            
            <div className="flex flex-wrap gap-6 justify-center items-center mt-4">
              {imagePreview ? (
                <>
                  {/* Current Image (Left) */}
                  <div 
                    className="relative rounded-full border border-stone-200 overflow-hidden group shadow-sm flex-shrink-0 bg-white"
                    style={{ width: '128px', height: '128px' }}
                  >
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1">
                      <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); setFormData({...formData, image_url: ""}); }} className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-red-500 shadow-md hover:bg-red-50 transition-colors border border-red-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    </div>
                  </div>

                  {/* Change Image Card (Right) */}
                  <div 
                    style={{ 
                      backgroundColor: '#F5EFE6', 
                      width: '128px',
                      height: '128px',
                      borderRadius: '12px', 
                      border: '2px dashed #d2c4b3', 
                      textAlign: 'center', 
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      flexShrink: 0,
                      position: 'relative'
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
                    <input
                      type="file"
                      id="imageUploadSmall"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="imageUploadSmall" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      <span className="text-xs font-bold text-[#8B7355] mb-2">Change Image</span>
                    </label>
                    <div style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                      <button 
                         type="button" 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePasteClick(); }}
                         className="flex items-center justify-center gap-1 hover:scale-105 transition-all z-10"
                         style={{ 
                           border: 'none', 
                           background: 'rgba(139, 115, 85, 0.15)', 
                           padding: '3px 8px', 
                           borderRadius: '12px',
                           color: '#4A3219',
                           fontSize: '10px',
                           fontWeight: 'bold',
                           cursor: 'pointer'
                         }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                        Paste
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div 
                  style={{ 
                    backgroundColor: '#F5EFE6', 
                    padding: '32px', 
                    borderRadius: '12px', 
                    border: '2px dashed #d2c4b3', 
                    textAlign: 'center', 
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    width: '100%',
                    maxWidth: '400px',
                    position: 'relative'
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
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="imageUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', height: '100%' }}>
                    <div style={{ backgroundColor: '#4A3219', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyItems: 'center', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(74, 50, 25, 0.3)', transition: 'transform 0.2s ease', justifyContent: 'center' }}
                         onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                         onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                    <div>
                      <p style={{ fontWeight: 'bold', color: '#4A3219', fontSize: '1rem', marginBottom: '4px' }}>Add New Image</p>
                      <p style={{ fontSize: '0.875rem', color: '#8B7355' }}>PNG, JPG up to 5MB</p>
                    </div>
                  </label>
                  
                  <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
                    <button 
                       type="button" 
                       onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePasteClick(); }}
                       className="flex items-center justify-center gap-1 hover:scale-105 transition-all z-10"
                       style={{ 
                         border: 'none', 
                         background: 'rgba(139, 115, 85, 0.15)', 
                         padding: '4px 10px', 
                         borderRadius: '12px',
                         color: '#4A3219',
                         fontSize: '11px',
                         fontWeight: 'bold',
                         cursor: 'pointer'
                       }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                      Paste
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8 w-full">
            <label className="block text-sm font-bold text-[#3E2C1C] mb-2 text-center">Category Name</label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full border border-stone-300 p-3 text-base rounded-xl focus:outline-none focus:border-[#4A3219] focus:ring-1 focus:ring-[#4A3219] transition-colors text-center"
              placeholder="e.g., Special Edition"
            />
          </div>

          <div className="flex flex-col gap-4 pt-8 border-t border-[#C4A484] w-full">
            <div className="flex gap-4 w-full">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ flexGrow: 1, border: 'none', minHeight: '50px' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/categories")}
                className="btn-secondary"
                style={{ flexGrow: 1, border: '1px solid #E6DCCF', minHeight: '50px', backgroundColor: '#FDFBF7', color: '#4A3219' }}
              >
                Cancel
              </button>
            </div>
            
            </div>
          </div>
        </form>
        
        {!isNew && (
          <div className="flex w-full justify-center mt-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if ((originalName || "").toLowerCase() === "bags") {
                  showToast("The 'Bags' category is a default system category and cannot be deleted.");
                  return;
                }
                setShowDeleteModal(true);
              }}
              disabled={saving}
              className="btn-outline flex items-center justify-center gap-2"
              style={{ width: '100%', maxWidth: '416px', border: '1px solid #dc2626', color: '#dc2626', minHeight: '50px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Delete Category
            </button>
          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="bg-[#FDFBF7] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E6DCCF]">
              <h3 className="text-xl font-bold text-[#4A3219] mb-2">Delete Category</h3>
              <p className="text-[#8B7355] text-sm mb-6">Are you sure you want to delete "{originalName}"? This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#4A3219] bg-[#F5EFE6] hover:bg-[#E6DCCF] transition-colors border border-[#E6DCCF]"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  onClick={async () => {
                    setShowDeleteModal(false);
                    setSaving(true);
                    try {
                      const { deleteCategory } = await import("@/lib/categoriesApi");
                      const success = await deleteCategory(params.id, originalName);
                      if (success) {
                        await revalidateStorefront();
                        await revalidateAdmin();
                        showToast("Category deleted successfully!");
                        router.refresh();
                        setTimeout(() => router.push("/admin/categories"), 1000);
                      } else {
                        showToast("Failed to delete category");
                        setSaving(false);
                      }
                    } catch (e) {
                      console.error(e);
                      showToast("Failed to delete category");
                      setSaving(false);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
