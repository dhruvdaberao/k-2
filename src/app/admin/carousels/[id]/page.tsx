"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { revalidateStorefront } from "@/actions/revalidate";
import { showToast } from "@/components/Toast";

export default function EditCarousel({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNew = params.id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showReload, setShowReload] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setShowReload(true), 4000);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    primary_cta_label: "",
    primary_cta_href: "/collections",
    secondary_cta_label: "View Collection",
    secondary_cta_href: "/collections",
    is_active: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [primaryDropdownOpen, setPrimaryDropdownOpen] = useState(false);
  const [secondaryDropdownOpen, setSecondaryDropdownOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("slug, name").order("priority", { ascending: false });
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("slug, title").order("created_at", { ascending: false });
    if (data) {
      setProducts(data);
      if (isNew && data.length > 0) {
        setFormData(prev => {
          if (prev.primary_cta_href === "/collections") {
            return { ...prev, primary_cta_href: `/products/${data[0].slug}` };
          }
          return prev;
        });
      }
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    if (!isNew) {
      fetchSlide();
    }
  }, []);

  const fetchSlide = async () => {
    try {
      const { data, error } = await supabase.from("hero_slides").select("*").eq("id", params.id).single();
      if (error) throw error;
      if (data) {
        setFormData(data);
        setImagePreview(data.image_url || data.image);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load slide");
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
    
    if (!imageFile && !formData.image_url) {
      showToast("Please complete all required fields (Image is missing)");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!formData.title || !formData.subtitle || !formData.primary_cta_label || !formData.primary_cta_href || !formData.secondary_cta_label || !formData.secondary_cta_href) {
      showToast("Please complete all required fields");
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = formData.image_url;

      // 1. Upload new image if provided
      if (imageFile) {
        // Delete old image if it exists and wasn't a static asset
        if (formData.image_url && !formData.image_url.startsWith("/uploads")) {
           const parts = formData.image_url.split("/");
           const oldFilename = parts[parts.length - 1];
           if (oldFilename) {
             await supabase.storage.from("carousel-images").remove([oldFilename]);
           }
        }

        const ext = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
        
        const { data: uploadData, error: uploadError } = await Promise.race([
          supabase.storage
            .from("carousel-images")
            .upload(fileName, imageFile, {
              cacheControl: "3600",
              upsert: false,
            }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000))
        ]).catch(err => ({ error: err }));

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("carousel-images")
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      if (!finalImageUrl) {
        throw new Error("An image is required!");
      }

      const slideData = {
        title: formData.title,
        subtitle: formData.subtitle,
        image_url: finalImageUrl,
        primary_cta_label: formData.primary_cta_label,
        primary_cta_href: formData.primary_cta_href,
        secondary_cta_label: formData.secondary_cta_label,
        secondary_cta_href: formData.secondary_cta_href,
        is_active: formData.is_active,
      };

      if (isNew) {
        // Get highest position
        const { data: posData } = await supabase.from("hero_slides").select("position").order("position", { ascending: false }).limit(1);
        const nextPos = posData && posData.length > 0 ? posData[0].position + 1 : 0;
        
        const { error } = await Promise.race([
          supabase.from("hero_slides").insert({ ...slideData, position: nextPos }),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000))
        ]).catch(err => ({ error: err }));
        if (error) throw error;
      } else {
        const { error } = await Promise.race([
          supabase.from("hero_slides").update(slideData).eq("id", params.id),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000))
        ]).catch(err => ({ error: err }));
        if (error) throw error;
      }

      await revalidateStorefront();
      showToast(`Carousel slide ${isNew ? 'added' : 'updated'} successfully!`);
      setTimeout(() => router.push("/admin/carousels"), 1000);
      
    } catch (err: any) {
      console.error(err);
      if (err.message === 'timeout') {
        showToast("Upload timed out. Please try saving again.");
      } else {
        showToast(err.message || "Failed to save slide");
      }
      setSaving(false);
    }
  };

  const requestDelete = () => {
    if (isNew) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      const { error } = await Promise.race([
        supabase.from("hero_slides").delete().eq("id", params.id),
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000))
      ]).catch(err => ({ error: err }));
      if (error) throw error;

      if (formData.image_url && !formData.image_url.startsWith("/uploads")) {
        const parts = formData.image_url.split("/");
        const filename = parts[parts.length - 1];
        if (filename) {
          await supabase.storage.from("carousel-images").remove([filename]);
        }
      }

      await revalidateStorefront();
      showToast("Slide deleted successfully!");
      setTimeout(() => router.push("/admin/carousels"), 1000);
    } catch (err: any) {
      console.error(err);
      if (err.message === 'timeout') {
        showToast("Action timed out. Please try again.");
      } else {
        showToast(err.message || "Failed to delete slide");
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
              href="/admin/carousels"
              className="p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#4A3219]">{isNew ? 'Add New Carousel' : 'Edit Carousel'}</h1>
            </div>
          </header>
          <div className="flex flex-col justify-center items-center py-32 gap-6">
            <div style={{
              width: 48,
              height: 48,
              border: '4px solid #e6ded4',
              borderTop: '4px solid #4A3219',
              borderRadius: '50%',
              animation: 'admin-spin 0.8s linear infinite',
            }}></div>
            <style>{`@keyframes admin-spin { to { transform: rotate(360deg); } }`}</style>
            
            {showReload && (
              <button 
                onClick={() => window.location.reload()} 
                type="button"
                style={{
                  marginTop: '20px',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4A3219',
                  color: '#4A3219',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Taking too long? Reload Page
              </button>
            )}
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
            href="/admin/carousels"
            className="p-2 text-[#8B7355] hover:bg-[#F5EFE6] rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#4A3219]">{isNew ? 'Add New Carousel' : 'Edit Carousel'}</h1>
          </div>
        </header>

        <form onSubmit={handleSubmit} noValidate className="">
          {/* Image Upload */}
          <div className="mb-8">
            <h3 className="font-bold text-[#4A3219] mb-2 text-lg md:text-xl border-b border-[#C4A484] pb-2">Carousel Media (Image or Video)</h3>
            <p className="text-xs text-[#8B7355] mb-4">Recommended size: 1440x720px (2:1 ratio). Images up to 5MB, MP4 videos up to 10MB.</p>
            
            <div className="flex flex-wrap justify-center gap-6 items-center mt-4">
              {imagePreview ? (
                <>
                  {/* Current Image (Left) */}
                  <div 
                    className="relative rounded-xl border border-stone-200 overflow-hidden group shadow-sm flex-shrink-0 bg-white"
                    style={{ width: '128px', height: '128px' }}
                  >
                    {(imagePreview.toLowerCase().includes('.mp4') || imagePreview.toLowerCase().includes('.webm') || (imageFile && imageFile.type.startsWith('video/'))) ? (
                      <video src={imagePreview} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-1 right-1">
                      <button type="button" onClick={() => { setImagePreview(null); setImageFile(null); }} className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-red-500 shadow-md hover:bg-red-50 transition-colors border border-red-100">
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
                      accept="image/png, image/jpeg, image/webp, video/mp4, video/webm"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="imageUploadSmall" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A3219" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      <span className="text-xs font-bold text-[#8B7355] mb-2">Change Media</span>
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
                    accept="image/png, image/jpeg, image/webp, video/mp4, video/webm"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="imageUpload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', height: '100%' }}>
                    <div style={{ backgroundColor: '#4A3219', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxShadow: '0 4px 6px -1px rgba(74, 50, 25, 0.3)', transition: 'transform 0.2s ease' }}
                         onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                         onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                    <div>
                      <p style={{ fontWeight: 'bold', color: '#4A3219', fontSize: '1rem', marginBottom: '4px' }}>Add Image or Video</p>
                      <p style={{ fontSize: '0.875rem', color: '#8B7355' }}>PNG, JPG, MP4, WEBM up to 10MB</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Status */}
            <div className="md:col-span-2 flex items-center justify-between p-4 md:p-5 rounded-xl border border-[#C4A484] shadow-sm" style={{ gridColumn: '1 / -1' }}>
              <div>
                <div className="font-bold text-sm md:text-base text-[#4A3219] mb-1">Carousel Visibility</div>
                <p className="text-[11px] md:text-xs text-[#8B7355]">When active, this slide will be shown on the homepage.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                <div style={{ position: 'relative', width: '40px', height: '24px' }}>
                  <input
                    type="checkbox"
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  {/* Track */}
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    borderRadius: '34px', transition: 'background-color 0.3s',
                    backgroundColor: formData.is_active ? '#4A3219' : '#E6DCCF'
                  }}></div>
                  {/* Thumb */}
                  <div style={{
                    position: 'absolute', top: '3px', left: '3px', 
                    width: '18px', height: '18px', borderRadius: '50%', 
                    backgroundColor: 'white', transition: 'transform 0.3s',
                    transform: formData.is_active ? 'translateX(16px)' : 'translateX(0)'
                  }}></div>
                </div>
              </label>
            </div>

            {/* Text Content */}
            <div className="md:col-span-2" style={{ gridColumn: '1 / -1' }}>
              <label className="block text-xs md:text-sm font-bold text-[#3E2C1C] mb-2">Main Heading</label>
              <input
                id="title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border border-stone-300 p-2 md:p-3 text-sm md:text-base rounded-xl focus:outline-none focus:border-[#4A3219] focus:ring-1 focus:ring-[#4A3219] transition-colors"
                placeholder="e.g., Soft Switch"
              />
            </div>
            
            <div className="md:col-span-2" style={{ gridColumn: '1 / -1' }}>
              <label className="block text-xs md:text-sm font-bold text-[#3E2C1C] mb-2">Subheading</label>
              <textarea
                id="subtitle"
                required
                value={formData.subtitle}
                onChange={(e) => {
                  setFormData({...formData, subtitle: e.target.value});
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                onFocus={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                rows={2}
                className="w-full border border-stone-300 p-2 md:p-3 text-sm md:text-base rounded-xl focus:outline-none focus:border-[#4A3219] focus:ring-1 focus:ring-[#4A3219] resize-none overflow-hidden transition-colors"
                placeholder="e.g., Discover comfortable and stylish clothing..."
              />
            </div>

            {/* Buttons Setup */}
            <div className="p-4 md:p-5 rounded-xl border border-[#C4A484] shadow-sm">
              <h3 className="text-base md:text-lg font-bold text-[#4A3219] mb-4 border-b border-[#C4A484] pb-2">Primary Button</h3>
              
              <div className="mb-4">
                <label className="block text-xs md:text-sm font-bold text-stone-600 mb-1">Button Text</label>
                <input
                  id="primary_cta_label"
                  type="text"
                  value={formData.primary_cta_label}
                  onChange={(e) => setFormData({...formData, primary_cta_label: e.target.value})}
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border border-stone-300 bg-white text-sm md:text-base text-[#3E2C1C] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-stone-600 mb-1">Links to Product</label>
                <div className="relative">
                  <div 
                    id="primary_cta_href"
                    tabIndex={0}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border border-stone-300 bg-white cursor-pointer flex justify-between items-center text-sm md:text-base text-[#3E2C1C] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                    style={{ outline: primaryDropdownOpen ? '2px solid #8B7355' : 'none' }}
                    onClick={() => {
                      setPrimaryDropdownOpen(!primaryDropdownOpen);
                      setProductSearch("");
                    }}
                  >
                    <span>{formData.primary_cta_href === "/collections" ? "All Products" : (products.find(p => `/products/${p.slug}` === formData.primary_cta_href)?.title || "All Products")}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: primaryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  
                  {primaryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setPrimaryDropdownOpen(false)}></div>
                      <div className="absolute z-20 w-full mt-2 bg-white border border-[#C4A484] rounded-xl shadow-lg max-h-60 flex flex-col" style={{ top: '100%' }}>
                        <div className="p-2 border-b border-stone-200 sticky top-0 bg-white rounded-t-xl z-30">
                          <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#8B7355]"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto flex-1">
                          <div 
                            className="px-4 py-3 hover:bg-[#F5EFE6] cursor-pointer text-[#3E2C1C] transition-colors text-sm"
                            style={{ backgroundColor: formData.primary_cta_href === "/collections" ? '#FDFBF7' : 'transparent', fontWeight: formData.primary_cta_href === "/collections" ? 'bold' : 'normal', display: "All Products".toLowerCase().includes(productSearch.toLowerCase()) ? 'block' : 'none' }}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, primary_cta_href: "/collections" }));
                              setPrimaryDropdownOpen(false);
                            }}
                          >
                            All Products
                          </div>
                          {products.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                            <div 
                              key={p.slug} 
                              className="px-4 py-3 hover:bg-[#F5EFE6] cursor-pointer text-[#3E2C1C] transition-colors text-sm"
                              style={{ backgroundColor: formData.primary_cta_href === `/products/${p.slug}` ? '#FDFBF7' : 'transparent', fontWeight: formData.primary_cta_href === `/products/${p.slug}` ? 'bold' : 'normal' }}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, primary_cta_href: `/products/${p.slug}` }));
                                setPrimaryDropdownOpen(false);
                              }}
                            >
                              {p.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-5 rounded-xl border border-[#C4A484] shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-[#C4A484] pb-2">
                <h3 className="text-base md:text-lg font-bold text-[#4A3219]">Secondary Button</h3>
                <span className="text-[11px] md:text-xs text-stone-500 bg-[#F5EFE6] px-2 py-1 rounded-full">Optional</span>
              </div>
              
              <div className="mb-4">
                <label className="block text-xs md:text-sm font-bold text-stone-600 mb-1">Button Text</label>
                <input
                  id="secondary_cta_label"
                  type="text"
                  value={formData.secondary_cta_label}
                  onChange={(e) => setFormData({...formData, secondary_cta_label: e.target.value})}
                  className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border border-stone-300 bg-white text-sm md:text-base text-[#3E2C1C] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                  placeholder="e.g., View Catalog"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-bold text-stone-600 mb-1">Links to Category</label>
                <div className="relative">
                  <div 
                    id="secondary_cta_href"
                    tabIndex={0}
                    className="w-full px-3 py-2 md:px-4 md:py-3 rounded-lg border border-stone-300 bg-white cursor-pointer flex justify-between items-center text-sm md:text-base text-[#3E2C1C] focus:outline-none focus:ring-2 focus:ring-[#8B7355]"
                    style={{ outline: secondaryDropdownOpen ? '2px solid #8B7355' : 'none' }}
                    onClick={() => {
                      setSecondaryDropdownOpen(!secondaryDropdownOpen);
                      setCategorySearch("");
                    }}
                  >
                    <span>{formData.secondary_cta_href === "/collections" ? "All Collections" : (categories.find(c => `/collections/${c.slug}` === formData.secondary_cta_href)?.name || "All Collections")}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: secondaryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                  
                  {secondaryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSecondaryDropdownOpen(false)}></div>
                      <div className="absolute z-20 w-full mt-2 bg-white border border-[#C4A484] rounded-xl shadow-lg max-h-60 flex flex-col" style={{ top: '100%' }}>
                        <div className="p-2 border-b border-stone-200 sticky top-0 bg-white rounded-t-xl z-30">
                          <input 
                            type="text" 
                            placeholder="Search categories..." 
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#8B7355]"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto flex-1">
                          <div 
                            className="px-4 py-3 hover:bg-[#F5EFE6] cursor-pointer text-[#3E2C1C] transition-colors text-sm"
                            style={{ backgroundColor: formData.secondary_cta_href === "/collections" ? '#FDFBF7' : 'transparent', fontWeight: formData.secondary_cta_href === "/collections" ? 'bold' : 'normal', display: "All Collections".toLowerCase().includes(categorySearch.toLowerCase()) ? 'block' : 'none' }}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, secondary_cta_href: "/collections" }));
                              setSecondaryDropdownOpen(false);
                            }}
                          >
                            All Collections
                          </div>
                          {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(c => (
                            <div 
                              key={c.slug} 
                              className="px-4 py-3 hover:bg-[#F5EFE6] cursor-pointer text-[#3E2C1C] transition-colors text-sm"
                              style={{ backgroundColor: formData.secondary_cta_href === `/collections/${c.slug}` ? '#FDFBF7' : 'transparent', fontWeight: formData.secondary_cta_href === `/collections/${c.slug}` ? 'bold' : 'normal' }}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, secondary_cta_href: `/collections/${c.slug}` }));
                                setSecondaryDropdownOpen(false);
                              }}
                            >
                              {c.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 pt-8 border-t border-[#C4A484] w-full">
            <div className="flex gap-4 w-full justify-center">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ flexGrow: 1, flexBasis: 'auto', maxWidth: '200px', border: 'none', minHeight: '50px' }}
              >
                {saving ? 'Saving...' : 'Save Slide'}
              </button>

              <button
                type="button"
                onClick={() => router.push("/admin/carousels")}
                className="btn-secondary"
                style={{ flexGrow: 1, flexBasis: 'auto', maxWidth: '200px', border: '1px solid #E6DCCF', minHeight: '50px', backgroundColor: '#FDFBF7', color: '#4A3219' }}
              >
                Cancel
              </button>
            </div>

            {!isNew && (
              <div className="flex w-full justify-center">
                <button
                  type="button"
                  onClick={requestDelete}
                  disabled={saving}
                  className="btn-outline"
                  style={{ width: '100%', maxWidth: '416px', border: '1px solid #dc2626', color: '#dc2626', minHeight: '50px' }}
                >
                  Delete Slide
                </button>
              </div>
            )}
          </div>
        </form>

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
            <div className="bg-[#FDFBF7] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E6DCCF] animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-[#4A3219] mb-2">Delete Slide</h3>
              <p className="text-[#8B7355] text-sm mb-6">Are you sure you want to delete this slide? This action cannot be undone.</p>
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
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
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
