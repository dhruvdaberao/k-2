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
import { revalidateStorefront } from "@/actions/revalidate";

const HOME_SECTION_OPTIONS = [
  { value: 'none', label: 'None (Automatic placement)' },
  { value: 'popular-picks', label: 'Signature Picks' },
  { value: 'best-sellers', label: 'Best Sellers' },
  { value: 'trending', label: 'New Arrivals' },
  { value: 'handmade', label: 'Our Favorites' },
];

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<boolean | number>(false);
  
  const [formData, setFormData] = useState({
    id: initialData?.id || "",
    slug: initialData?.slug || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price !== undefined ? (initialData.price === 0 && !isEdit ? "" : initialData.price) : "",
    category: initialData?.category || "",
    stock: initialData?.stock !== undefined ? initialData.stock : 999,
    variants: initialData?.variants || null,
    badges: initialData?.badges || [],
    badge: initialData?.badge || "",
    tags: initialData?.tags || ["handmade"],
    type: initialData?.type || "direct-purchase",
    homeSection: initialData?.homeSection || (initialData?.tags?.find((t: string) => t.startsWith('_homeSection:'))?.split(':')[1]) || "none",
    discount_active: initialData?.discount_active || false,
    discount_percentage: initialData?.discount_percentage || "",
  });
  
  const [tagInput, setTagInput] = useState("");
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [homeSectionDropdownOpen, setHomeSectionDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    getLiveCategories().then(data => {
      setCategories(data);
      if (!formData.category && data.length > 0) {
        setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    });
  }, []);
  
  const [hasVariants, setHasVariants] = useState<boolean>(!!(initialData?.variants && initialData.variants.length > 0));
  const [variants, setVariants] = useState<any[]>(initialData?.variants || []);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [draggedOverIdx, setDraggedOverIdx] = useState<number | null>(null);
  const [expandedVariantIndex, setExpandedVariantIndex] = useState<number | null>(0);
  const [variantTagInputs, setVariantTagInputs] = useState<Record<number, string>>({});

  const draftKey = `draft_product_${initialData?.id || 'new'}`;
  const isInitialMount = useRef(true);

  // Restore Draft
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.variants) setVariants(parsed.variants);
        if (parsed.images) setImages(parsed.images);
        if (parsed.hasVariants !== undefined) setHasVariants(parsed.hasVariants);
        setTimeout(() => showToast("Restored unsaved draft."), 500);
      }
    } catch (e) {
      console.error("Failed to parse draft", e);
    }
  }, [draftKey]);

  // Save Draft
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const safeImages = images.filter(img => !img.startsWith('blob:'));
    const safeVariants = variants.map(v => ({
      ...v,
      images: (v.images || []).filter((img: string) => !img.startsWith('blob:'))
    }));
    const draft = { formData, variants: safeVariants, images: safeImages, hasVariants };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [formData, variants, images, hasVariants, draftKey]);

  // Clear draft when leaving the page (but keep it on hard refresh)
  useEffect(() => {
    return () => {
      localStorage.removeItem(draftKey);
    };
  }, [draftKey]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter((t: string) => t !== tagToRemove) }));
  };

  const handleAddVariantTag = (vIdx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = (variantTagInputs[vIdx] || "").trim().toLowerCase();
      if (newTag) {
        setVariants(prev => {
          const newVariants = [...prev];
          const currentTags = newVariants[vIdx].tags || [];
          if (!currentTags.includes(newTag)) {
             newVariants[vIdx].tags = [...currentTags, newTag];
          }
          return newVariants;
        });
      }
      setVariantTagInputs(prev => ({ ...prev, [vIdx]: "" }));
    }
  };

  const removeVariantTag = (vIdx: number, tagToRemove: string) => {
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[vIdx].tags = (newVariants[vIdx].tags || []).filter((t: string) => t !== tagToRemove);
      return newVariants;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: string | number = value;
    if (type === "number") {
      finalValue = value === "" ? "" : (parseFloat(value) || 0);
    }
    
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

  const processFiles = async (files: File[], variantIndex?: number) => {
    if (files.length === 0) return;
    const localPreviews = files.map(f => URL.createObjectURL(f));

    // 1. Instant UI Preview
    if (typeof variantIndex === 'number') {
      setVariants(prev => {
        const newVariants = [...prev];
        newVariants[variantIndex] = {
          ...newVariants[variantIndex],
          images: [...(newVariants[variantIndex].images || []), ...localPreviews]
        };
        return newVariants;
      });
    } else {
      if (hasVariants) {
        setImages(prev => prev.length === 0 ? [localPreviews[0]] : prev);
      } else {
        setImages(prev => [...prev, ...localPreviews]);
      }
    }

    setUploadingImages(typeof variantIndex === 'number' ? variantIndex : true);

    try {
      const productId = formData.id || 'temp_' + Date.now();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const localPreviewUrl = localPreviews[i];
        
        let compressedFile = file;
        try {
          const options = {
            maxSizeMB: 0.8,
            maxWidthOrHeight: 1280,
            useWebWorker: true, 
            initialQuality: 0.8,
            maxIteration: 10
          };
          compressedFile = await imageCompression(file, options);
        } catch (error) {
          console.error("Compression failed, using original file", error);
        }

        const fileExt = compressedFile.name.split('.').pop() || 'jpg';
        const fileName = `${productId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const startTime = Date.now();
        const { error: uploadError } = await Promise.race([
          supabase.storage.from('product-images').upload(fileName, compressedFile),
          new Promise<any>((_, reject) => {
            const check = () => {
              if (Date.now() - startTime > 30000) {
                reject(new Error('timeout'));
              } else {
                setTimeout(check, 1000);
              }
            };
            check();
          })
        ]).catch(err => ({ error: err }));

        if (uploadError) {
          console.error("Upload error:", uploadError);
          showToast(`Failed to upload ${file.name}`);
          // Remove failed local preview
          if (typeof variantIndex === 'number') {
            setVariants(prev => {
              const newVariants = [...prev];
              newVariants[variantIndex].images = newVariants[variantIndex].images.filter((url: string) => url !== localPreviewUrl);
              return newVariants;
            });
          } else {
            setImages(prev => prev.filter(url => url !== localPreviewUrl));
          }
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        
        // Swap local preview with real URL silently
        if (typeof variantIndex === 'number') {
          setVariants(prev => {
            const newVariants = [...prev];
            newVariants[variantIndex].images = newVariants[variantIndex].images.map((url: string) => url === localPreviewUrl ? publicUrl : url);
            return newVariants;
          });
        } else {
          setImages(prev => prev.map(url => url === localPreviewUrl ? publicUrl : url));
        }
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred during upload.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantIndex?: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    await processFiles(files, variantIndex);
    e.target.value = ''; // reset input
  };

  // Global Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        if ((activeEl as HTMLInputElement).type !== 'file') return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.type.indexOf("image") === 0) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        processFiles(files);
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [hasVariants, formData.id, images, variants]);

  const handlePasteClick = async (variantIndex?: number) => {
    try {
      const items = await navigator.clipboard.read();
      const files: File[] = [];
      for (const item of items) {
        const imageType = item.types.find(type => type.startsWith("image/"));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: imageType });
          files.push(file);
        }
      }
      if (files.length > 0) {
        processFiles(files, variantIndex);
      } else {
        showToast("No image found in clipboard");
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      showToast("Please allow clipboard permissions or use Ctrl+V");
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
    setDraggedOverIdx(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    setDraggedOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOverIdx(null);
    if (draggedIdx === null) return;
    
    const newImages = [...images];
    const draggedImg = newImages[draggedIdx];
    newImages.splice(draggedIdx, 1);
    newImages.splice(index, 0, draggedImg);
    
    setImages(newImages);
    setDraggedIdx(null);
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    const newIdx = direction === 'left' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= images.length) return;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[newIdx];
    newImages[newIdx] = temp;
    setImages(newImages);
  };

  const moveVariantImage = (vIdx: number, iIdx: number, direction: 'left' | 'right') => {
    setVariants(prev => {
      const newVariants = [...prev];
      const variantImages = [...newVariants[vIdx].images];
      const newIIdx = direction === 'left' ? iIdx - 1 : iIdx + 1;
      if (newIIdx < 0 || newIIdx >= variantImages.length) return prev;
      
      const temp = variantImages[iIdx];
      variantImages[iIdx] = variantImages[newIIdx];
      variantImages[newIIdx] = temp;
      newVariants[vIdx].images = variantImages;
      return newVariants;
    });
  };

  const handleVariantChange = (index: number, field: string, value: any) => {
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[index] = { ...newVariants[index], [field]: value };
      if (field === 'name') {
         newVariants[index].slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      }
      return newVariants;
    });
  };

  const addVariant = () => {
    setVariants(prev => {
      setExpandedVariantIndex(prev.length);
      return [...prev, { name: '', slug: '', price: formData.price || 0, stock: 999, images: [], tags: ["handmade"] }];
    });
  };

  const removeVariant = (index: number) => {
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariants(prev => {
      const newVariants = [...prev];
      newVariants[variantIndex].images = newVariants[variantIndex].images.filter((_: any, i: number) => i !== imageIndex);
      return newVariants;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.description?.trim() || formData.price === "" || formData.price === undefined) {
      showToast("Please complete all required fields (Title, Description, and Price).");
      return;
    }
    
    if (!formData.id) {
      showToast("Product ID (Slug) is required.");
      return;
    }

    // Prevent saving if there are unresolved local preview blob URLs
    if (images.some(img => img.startsWith('blob:'))) {
      showToast("Please wait for images to finish uploading, or remove failed images (the ones with the loading spinner).");
      return;
    }
    if (hasVariants && variants.some(v => v.images && v.images.some((img: string) => img.startsWith('blob:')))) {
      showToast("Please wait for variant images to finish uploading, or remove failed images.");
      return;
    }

    if (formData.discount_active) {
      const pct = Number(formData.discount_percentage);
      if (!pct || pct < 1 || pct > 99) {
        showToast("Please enter a valid personal discount percentage (1-99).");
        return;
      }
    }

    setLoading(true);
    
    const productPayload: any = {
      ...formData,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0,
      discount_percentage: formData.discount_percentage === "" || formData.discount_percentage === null ? null : Number(formData.discount_percentage),
      variants: hasVariants ? variants : null,
      images,
      status: 'live'
    };

    // Polyfill for homeSection without DB schema changes
    productPayload.tags = (productPayload.tags || []).filter((t: string) => !t.startsWith('_homeSection:'));
    if (productPayload.homeSection && productPayload.homeSection !== 'none') {
      productPayload.tags.push(`_homeSection:${productPayload.homeSection}`);
    }
    delete productPayload.homeSection;


    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token || "";

      const fetchPromise = fetch('/api/admin/catalog/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productPayload)
      }).then(async res => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save product');
        return data;
      });

      await Promise.race([
        fetchPromise,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
      ]);
    } catch (err: any) {
      if (err.message === 'timeout') {
        showToast("Upload timed out. Please try saving again.");
      } else {
        showToast("Network error: " + err.message);
      }
      setLoading(false);
      return;
    }

    if (isEdit && initialData) {
      // Clean up orphaned images from storage
      const oldImages = initialData.images || [];
      const oldVariantImages = (initialData.variants || []).flatMap((v: any) => v.images || []);
      const allOldUrls = [...oldImages, ...oldVariantImages];

      const newImages = images || [];
      const newVariantImages = (hasVariants ? variants : []).flatMap((v: any) => v.images || []);
      const allNewUrls = [...newImages, ...newVariantImages];

      const removedUrls = allOldUrls.filter(url => !allNewUrls.includes(url));
      
      const pathsToDelete = removedUrls.map(url => {
        const parts = url.split('product-images/');
        return parts.length === 2 ? parts[1] : null;
      }).filter(Boolean) as string[];

      if (pathsToDelete.length > 0) {
        supabase.storage.from('product-images').remove(pathsToDelete)
          .catch((err: any) => console.error("Failed to clean up storage:", err));
      }
    }

    setLoading(false);

    showToast(isEdit ? "Product updated successfully ✓" : "Product added successfully ✓");
    revalidateStorefront().catch(err => console.error("Revalidation failed:", err));
    localStorage.removeItem(`draft_product_${initialData?.id || 'new'}`);
    router.push("/admin/products");
    router.refresh();
  };

  const executeDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);

    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token || "";

      const fetchPromise = fetch(`/api/admin/catalog/products?id=${formData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(async res => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete product');
        return data;
      });

      await Promise.race([
        fetchPromise,
        new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
      ]);
    } catch (err: any) {
      if (err.message === 'timeout') {
        showToast("Action timed out. Please try again.");
      } else {
        showToast("Network error: " + err.message);
      }
      setLoading(false);
      return;
    }
    
    if (isEdit && initialData) {
      // Clean delete: wipe all images from storage
      const allOldUrls = [
        ...(initialData.images || []), 
        ...((initialData.variants || []).flatMap((v: any) => v.images || []))
      ];
      
      const pathsToDelete = allOldUrls.map(url => {
        const parts = url.split('product-images/');
        return parts.length === 2 ? parts[1] : null;
      }).filter(Boolean) as string[];

      if (pathsToDelete.length > 0) {
        supabase.storage.from('product-images').remove(pathsToDelete)
          .catch((err: any) => console.error("Failed to wipe storage:", err));
      }
    }

    setLoading(false);
    
    showToast("Product deleted successfully");
    revalidateStorefront().catch(err => console.error("Revalidation failed:", err));
    router.push("/admin/products");
    router.refresh();
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
      {loading && <GlobalLoader message="Saving Product..." />}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Left Column: Details */}
        <div className="space-y-4">
          <h2 className="text-base md:text-xl font-bold text-[#4A3219] mb-2 md:mb-4 border-b border-[#C4A484] pb-1 md:pb-2">Product Details</h2>
          
          <div>
            <label className="block text-sm font-semibold text-[#8B7355] mb-1">Product Title</label>
            <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355]" placeholder="e.g. Handmade Crochet Tulip" />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#8B7355] mb-1">Product ID (Slug)</label>
              <input type="text" name="id" required value={formData.id} onChange={handleInputChange} disabled={isEdit} className={`w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] ${isEdit ? 'bg-gray-100' : 'focus:outline-none focus:ring-2 focus:ring-[#8B7355]'}`} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#8B7355] mb-1">Category</label>
              <div className="relative">
                <div 
                  className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] bg-white cursor-pointer flex justify-between items-center text-[#3E2C1C]"
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
                    <div className="absolute z-20 w-full mt-2 bg-white border border-[#C4A484] rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col" style={{ top: '100%' }}>
                      <div className="p-2 border-b border-[#E6DCCF]">
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          className="w-full p-2 text-sm rounded-lg border border-[#E6DCCF] focus:outline-none focus:ring-1 focus:ring-[#8B7355] text-[#4A3219]"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="overflow-y-auto">
                        {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(c => (
                          <div 
                            key={c.id} 
                            className="px-4 py-3 hover:bg-[#F5EFE6] cursor-pointer text-[#3E2C1C] transition-colors"
                            style={{ backgroundColor: formData.category === c.name ? '#FDFBF7' : 'transparent', fontWeight: formData.category === c.name ? 'bold' : 'normal' }}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, category: c.name }));
                              setDropdownOpen(false);
                              setCategorySearch("");
                            }}
                          >
                            {c.name}
                          </div>
                        ))}
                        {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-sm text-[#8B7355] italic">No categories found.</div>
                        )}
                      </div>
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
                className="w-full p-3 rounded-xl border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355] bg-white resize-none overflow-hidden" 
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
              
              {(() => {
                const activeCat = categories.find(c => c.name === formData.category);
                const isCatDiscount = activeCat?.discount_active;
                const effActive = isCatDiscount || formData.discount_active;
                const effPct = isCatDiscount ? activeCat?.discount_percentage : formData.discount_percentage;
                
                if (effActive) {
                  const originalPrice = Number(formData.price) || 0;
                  const discountedPrice = Math.round(originalPrice - (originalPrice * Number(effPct) / 100));
                  return (
                    <div className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] bg-[#F9F6F0] flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      <span className="text-[#8B7355] text-sm md:text-base font-medium line-through opacity-70">₹{originalPrice}</span>
                      <span className="font-bold text-[#4A3219] text-sm md:text-base ml-1">₹{discountedPrice}</span>
                      <span className="font-bold text-[#8B7355] text-xs ml-1">({effPct}% OFF)</span>
                      {isCatDiscount && <span className="ml-auto text-[10px] uppercase font-bold bg-[#8B7355] text-white px-2 py-1 rounded">Category Discount</span>}
                    </div>
                  );
                }
                
                return (
                  <input type="number" name="price" required min="0" value={formData.price} onChange={handleInputChange} className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355]" />
                );
              })()}
              
              {/* Product Discount Toggle */}
              {(() => {
                const activeCat = categories.find(c => c.name === formData.category);
                const isCatDiscount = activeCat?.discount_active;
                
                if (isCatDiscount) {
                  return (
                    <div className="mt-2 text-xs text-[#8B7355] italic">
                      Personal discount disabled because category "{formData.category}" has an active discount.
                    </div>
                  );
                }
                
                return (
                  <div className="mt-3 p-3 md:p-4 rounded-xl border border-[#C4A484] bg-white">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#8B7355]">Personal Discount</span>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                        <div style={{ position: 'relative', width: '56px', height: '32px' }}>
                          <input
                            type="checkbox"
                            style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                            checked={formData.discount_active}
                            onChange={(e) => setFormData(prev => ({...prev, discount_active: e.target.checked}))}
                          />
                          {/* Track */}
                          <div style={{ 
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                            borderRadius: '34px', transition: 'background-color 0.3s',
                            backgroundColor: formData.discount_active ? '#4A3219' : '#E6DCCF'
                          }}></div>
                          {/* Thumb */}
                          <div style={{
                            position: 'absolute', top: '4px', left: '4px', 
                            width: '24px', height: '24px', borderRadius: '50%', 
                            backgroundColor: 'white', transition: 'transform 0.3s',
                            transform: formData.discount_active ? 'translateX(24px)' : 'translateX(0)'
                          }}></div>
                        </div>
                      </label>
                    </div>
                    {formData.discount_active && (
                      <div className="mt-4 flex items-center justify-between border-t border-[#E6DCCF] pt-4">
                        <span className="text-sm font-semibold text-[#8B7355]">Percentage Off</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            value={formData.discount_percentage}
                            onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                            className="w-20 p-2 text-sm md:text-base rounded-xl border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355] text-center font-bold text-[#4A3219]"
                            placeholder="10"
                          />
                          <span className="text-[#8B7355] font-bold text-sm">%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#8B7355] mb-2">Stock Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                  <div style={{ position: 'relative', width: '56px', height: '32px' }}>
                    <input
                      type="checkbox"
                      style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                      checked={formData.stock > 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.checked ? (prev.stock > 0 ? prev.stock : 1) : 0 }))}
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
                  <div style={{ fontWeight: '600', color: formData.stock > 0 ? '#4A3219' : '#8B7355', width: '80px' }}>
                    {formData.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label className="text-sm font-semibold text-[#8B7355]">Qty:</label>
                  <input 
                    type="number" 
                    name="stock" 
                    min="0" 
                    value={formData.stock} 
                    onChange={handleInputChange} 
                    className="w-24 p-2 text-sm md:text-base rounded-xl border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355]" 
                  />
                </div>
              </div>

              <label className="block text-sm font-semibold text-[#8B7355] mb-2">Purchase Mode</label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
                <div style={{ position: 'relative', width: '56px', height: '32px' }}>
                  <input
                    type="checkbox"
                    style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                    checked={formData.type === 'custom-order'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.checked ? 'custom-order' : 'direct-purchase' }))}
                  />
                  {/* Track */}
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    borderRadius: '34px', transition: 'background-color 0.3s',
                    backgroundColor: formData.type === 'custom-order' ? '#4A3219' : '#E6DCCF'
                  }}></div>
                  {/* Thumb */}
                  <div style={{
                    position: 'absolute', top: '4px', left: '4px', 
                    width: '24px', height: '24px', borderRadius: '50%', 
                    backgroundColor: 'white', transition: 'transform 0.3s',
                    transform: formData.type === 'custom-order' ? 'translateX(24px)' : 'translateX(0)'
                  }}></div>
                </div>
                <div style={{ fontWeight: '600', color: formData.type === 'custom-order' ? '#4A3219' : '#8B7355' }}>
                  {formData.type === 'custom-order' ? 'Enquire Only' : 'Buy / Add to Bag'}
                </div>
              </label>
              
              <label className="block text-sm font-semibold text-[#8B7355] mt-6 mb-1">Home Page Section</label>
              <div className="relative">
                <div 
                  className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] bg-white cursor-pointer flex justify-between items-center text-[#3E2C1C]"
                  style={{ outline: homeSectionDropdownOpen ? '2px solid #8B7355' : 'none', minHeight: '42px' }}
                  onClick={() => setHomeSectionDropdownOpen(!homeSectionDropdownOpen)}
                >
                  <span style={{ fontWeight: formData.homeSection !== 'none' ? 'bold' : 'normal', color: formData.homeSection !== 'none' ? '#3E2C1C' : '#8B7355' }}>
                    {HOME_SECTION_OPTIONS.find(o => o.value === formData.homeSection)?.label || 'None (Automatic placement)'}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: homeSectionDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', marginLeft: '8px' }}>
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
                
                {homeSectionDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setHomeSectionDropdownOpen(false)}></div>
                    <div className="absolute z-20 w-full mt-2 bg-white border border-[#C4A484] rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col" style={{ top: '100%' }}>
                      <div className="overflow-y-auto py-1">
                        {HOME_SECTION_OPTIONS.map(opt => (
                          <div 
                            key={opt.value} 
                            className="px-4 py-3 hover:bg-[#F5EFE6] cursor-pointer text-[#3E2C1C] transition-colors"
                            style={{ backgroundColor: formData.homeSection === opt.value ? '#FDFBF7' : 'transparent', fontWeight: formData.homeSection === opt.value ? 'bold' : 'normal' }}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, homeSection: opt.value as any }));
                              setHomeSectionDropdownOpen(false);
                            }}
                          >
                            {opt.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div>
              <label className="block text-sm font-semibold text-[#8B7355] mb-1">Tags (Press Enter)</label>
              <input 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355] mb-2" 
                placeholder="e.g. handmade, valentine" 
              />
              <div className="flex flex-wrap gap-2">
                {formData.tags?.filter((tag: string) => !tag.startsWith('_homeSection:')).map((tag: string) => (
                  <div key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FDFBF7] text-[#4A3219] text-sm font-semibold rounded-lg border border-[#C4A484] shadow-sm max-w-full">
                    <span className="text-[#8B7355] opacity-70 shrink-0">#</span>
                    <span className="truncate shrink">{tag}</span>
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)} 
                      className="ml-1 text-[#ef4444] hover:text-red-700 transition-colors flex items-center justify-center shrink-0"
                      style={{ background: 'transparent', border: 'none', padding: 0, outline: 'none', cursor: 'pointer' }}
                      title="Remove tag"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Images */}
        <div className="space-y-4">
          <h2 className="text-base md:text-xl font-bold text-[#4A3219] mb-2 md:mb-4 border-b border-[#C4A484] pb-1 md:pb-2">Images</h2>
          
          {(!hasVariants || images.length === 0) && (
            <div 
              style={{ 
                backgroundColor: '#F5EFE6', 
                padding: '40px', 
                borderRadius: '16px', 
                border: '2px dashed #d2c4b3', 
                textAlign: 'center', 
                transition: 'all 0.3s ease',
                cursor: 'pointer',
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
                <span style={{ fontWeight: 'bold', color: '#4A3219', fontSize: '1.125rem', marginTop: '4px' }}>Add {hasVariants ? 'Cover Image' : 'New Images'}</span>
                <span style={{ fontSize: '0.875rem', color: '#8B7355' }}>PNG, JPG up to 5MB</span>
              </label>
              
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '12px' }}>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                  Paste
                </button>
              </div>
            </div>
          )}

          {uploadingImages === true && (
            <div className="mt-4 p-4 rounded-xl border border-[#C4A484] bg-[#FDFBF7]">
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
              <p className="text-xs text-[#8B7355] mb-2 font-semibold">
                {hasVariants ? "Cover Image" : "Drag to reorder (Primary image first)"}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                {images.map((img, idx) => {
                  const isFaded = hasVariants && idx > 0;
                  return (
                  <div
                    key={img}
                    draggable={!isFaded}
                    onDragStart={(e) => !isFaded && handleDragStart(e, idx)}
                    onDragOver={(e) => !isFaded && handleDragOver(e, idx)}
                    onDragLeave={!isFaded ? handleDragLeave : undefined}
                    onDrop={(e) => !isFaded && handleDrop(e, idx)}
                    className="group"
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: '12px',
                      border: draggedOverIdx === idx && !isFaded ? '3px solid #4A3219' : '1px solid #E6DCCF',
                      overflow: 'hidden',
                      cursor: isFaded ? 'default' : 'grab',
                      backgroundColor: 'white',
                      boxShadow: draggedOverIdx === idx && !isFaded ? '0 0 0 4px rgba(74, 50, 25, 0.1)' : '0 1px 2px rgba(0,0,0,0.05)',
                      opacity: isFaded ? 0.3 : (draggedIdx === idx ? 0.5 : 1),
                      filter: isFaded ? 'grayscale(80%)' : 'none',
                      transform: draggedOverIdx === idx && !isFaded ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.2s ease-in-out'
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
                      border: '2px solid white', zIndex: 10,
                      opacity: draggedIdx === idx ? 0 : 1
                    }}>
                      {idx + 1}
                    </div>

                    {idx === 0 && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        backgroundColor: 'rgba(74, 50, 25, 0.9)', color: 'white',
                        fontSize: '10px', fontWeight: 'bold', textAlign: 'center', padding: '4px 0', zIndex: 10,
                        opacity: draggedIdx === idx ? 0 : 1
                      }}>
                        MAIN COVER
                      </div>
                    )}

                    {isFaded && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white',
                        fontSize: '10px', fontWeight: 'bold', textAlign: 'center', padding: '4px 0', zIndex: 10
                      }}>
                        NOT IN USE
                      </div>
                    )}

                    {img.startsWith('blob:') && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 15
                      }}>
                        <div className="w-6 h-6 rounded-full border-2 border-[#4A3219] border-t-transparent animate-spin mb-1"></div>
                        <span className="text-[10px] font-bold text-[#4A3219]">Uploading...</span>
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

                    {/* Mobile Reorder Controls */}
                    {!isFaded && (
                      <>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => { e.preventDefault(); moveImage(idx, 'left'); }}
                          className="md:hidden z-10 disabled:opacity-30 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]"
                          style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '2px', background: 'transparent', border: 'none', padding: 0, opacity: draggedIdx === idx ? 0 : 1 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        </button>
                        <button
                          type="button"
                          disabled={idx === images.length - 1}
                          onClick={(e) => { e.preventDefault(); moveImage(idx, 'right'); }}
                          className="md:hidden z-10 disabled:opacity-30 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]"
                          style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '2px', background: 'transparent', border: 'none', padding: 0, opacity: draggedIdx === idx ? 0 : 1 }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                      </>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Variants Section */}
      <div className="pt-6 mt-6 border-t border-[#C4A484]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-[#4A3219]">Product Variants</h2>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '12px' }}>
            <span className="text-sm font-semibold text-[#8B7355]">Enable Variants</span>
            <div style={{ position: 'relative', width: '50px', height: '28px' }}>
              <input
                type="checkbox"
                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                checked={hasVariants}
                onChange={(e) => setHasVariants(e.target.checked)}
              />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '34px', backgroundColor: hasVariants ? '#4A3219' : '#E6DCCF', transition: 'background-color 0.3s' }}></div>
              <div style={{ position: 'absolute', top: '4px', left: '4px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', transition: 'transform 0.3s', transform: hasVariants ? 'translateX(22px)' : 'translateX(0)' }}></div>
            </div>
          </label>
        </div>

        {hasVariants && (
          <div className="space-y-6">
            {variants.map((variant, vIdx) => {
               const isExpanded = expandedVariantIndex === vIdx;
               return (
               <div key={vIdx} className="p-4 md:p-6 bg-[#FDFBF7] border border-[#C4A484] rounded-2xl relative shadow-sm hover:shadow-md transition-shadow">
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeVariant(vIdx); }} className="absolute top-4 right-4 transition-colors z-10" style={{ background: 'none', border: 'none', padding: '0', color: '#ef4444', cursor: 'pointer' }} title="Remove Variant">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                  <div className="flex items-center gap-4 cursor-pointer pr-8" onClick={() => setExpandedVariantIndex(isExpanded ? null : vIdx)}>
                     <h3 className="font-bold text-[#4A3219] text-lg flex-1 truncate">{variant.name || `Variant ${vIdx + 1}`}</h3>
                     {!isExpanded && (
                       <div className="flex items-center gap-4">
                         <span className="text-sm font-bold text-[#5A3E2B]">₹{variant.price || 0}</span>
                         <span className="text-[10px] font-bold px-2 py-1 rounded bg-[#E6DCCF] text-[#4A3219]">{variant.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                       </div>
                     )}
                     <div className="text-[#8B7355]" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                     </div>
                  </div>
                  {isExpanded && (
                    <div className="pt-6 mt-4 border-t border-[#E6DCCF]">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#8B7355] mb-1">Variant Name</label>
                      <input type="text" required value={variant.name} onChange={(e) => handleVariantChange(vIdx, 'name', e.target.value)} className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355] bg-white" placeholder="e.g. Red Rose" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8B7355] mb-1">Price (₹)</label>
                      <input type="number" required min="0" value={variant.price} onChange={(e) => handleVariantChange(vIdx, 'price', parseFloat(e.target.value) || 0)} className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355] bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#8B7355] mb-1">Stock</label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', marginTop: '10px' }}>
                        <div style={{ position: 'relative', width: '40px', height: '24px' }}>
                          <input type="checkbox" style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} checked={variant.stock > 0} onChange={(e) => handleVariantChange(vIdx, 'stock', e.target.checked ? 999 : 0)} />
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: '34px', backgroundColor: variant.stock > 0 ? '#4A3219' : '#E6DCCF', transition: 'background-color 0.3s' }}></div>
                          <div style={{ position: 'absolute', top: '2px', left: '2px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'white', transition: 'transform 0.3s', transform: variant.stock > 0 ? 'translateX(16px)' : 'translateX(0)' }}></div>
                        </div>
                        <span className="text-sm font-semibold" style={{ color: variant.stock > 0 ? '#4A3219' : '#8B7355' }}>{variant.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                      </label>
                    </div>
                      </div>

                      <div className="mb-5">
                        <label className="block text-xs font-semibold text-[#8B7355] mb-1">Variant Tags (Press Enter)</label>
                        <input type="text" value={variantTagInputs[vIdx] || ''} onChange={(e) => setVariantTagInputs(prev => ({ ...prev, [vIdx]: e.target.value }))} onKeyDown={(e) => handleAddVariantTag(vIdx, e)} className="w-full p-2 md:p-3 text-sm md:text-base rounded-xl border border-[#C4A484] focus:outline-none focus:ring-2 focus:ring-[#8B7355] bg-white mb-2" placeholder="e.g. handmade, red" />
                        <div className="flex flex-wrap gap-2">
                          {(variant.tags || []).map((tag: string) => (
                            <div key={tag} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FDFBF7] text-[#4A3219] text-sm font-semibold rounded-lg border border-[#C4A484] shadow-sm max-w-full">
                              <span className="text-[#8B7355] opacity-70 shrink-0">#</span>
                              <span className="truncate shrink">{tag}</span>
                              <button type="button" onClick={() => removeVariantTag(vIdx, tag)} className="ml-1 text-[#ef4444] hover:text-red-700 flex items-center justify-center shrink-0" style={{ background: 'transparent', border: 'none', padding: 0, outline: 'none', cursor: 'pointer' }}><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#8B7355] mb-2">Variant Images</label>
                    
                    <div 
                      style={{ 
                        backgroundColor: '#F5EFE6', 
                        padding: '20px', 
                        borderRadius: '12px', 
                        border: '2px dashed #d2c4b3', 
                        textAlign: 'center', 
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        marginBottom: '16px',
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
                      <input type="file" id={`variant-upload-${vIdx}`} multiple accept="image/*" onChange={(e) => handleImageUpload(e, vIdx)} style={{ display: 'none' }} />
                      <label htmlFor={`variant-upload-${vIdx}`} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '100%', height: '100%' }}>
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
                        <span style={{ fontSize: '0.875rem', color: '#8B7355', marginBottom: '8px' }}>PNG, JPG up to 5MB</span>
                                             <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '12px' }}>
                          <button 
                             type="button" 
                             onClick={(e) => { e.preventDefault(); e.stopPropagation(); handlePasteClick(vIdx); }}
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                            Paste
                          </button>
                        </div>
                      </label>
                    </div>
                    {uploadingImages === vIdx && (
                      <div className="mt-4 p-4 rounded-xl border border-[#C4A484] bg-[#FDFBF7]">
                        <div className="flex justify-between text-sm font-semibold text-[#4A3219] mb-2">
                          <span>Uploading images...</span>
                          <span className="animate-pulse text-[#8B7355]">Processing</span>
                        </div>
                        <div className="w-full h-2 bg-[#E6DCCF] rounded-full overflow-hidden relative">
                          <div className="absolute top-0 bottom-0 left-0 bg-[#4A3219] rounded-full" style={{ animation: 'loadingBar 1.5s infinite ease-in-out' }}></div>
                        </div>
                      </div>
                    )}

                    {variant.images && variant.images.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                        {variant.images.map((img: string, iIdx: number) => (
                          <div
                            key={img}
                            style={{
                              position: 'relative',
                              width: '100%',
                              aspectRatio: '1 / 1',
                              borderRadius: '12px',
                              border: '1px solid #E6DCCF',
                              overflow: 'hidden',
                              backgroundColor: 'white',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          >
                            <ImageWithFallback src={img} alt={`Preview ${iIdx}`} fill style={{ objectFit: 'cover' }} />
                            
                            {img.startsWith('blob:') && (
                              <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 15
                              }}>
                                <div className="w-6 h-6 rounded-full border-2 border-[#4A3219] border-t-transparent animate-spin mb-1"></div>
                              </div>
                            )}
                            
                            <div style={{ 
                              position: 'absolute', top: '6px', left: '6px', 
                              backgroundColor: '#4A3219', color: '#ffffff', 
                              width: '24px', height: '24px', 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                              borderRadius: '50%', fontSize: '12px', fontWeight: 'bold', 
                              border: '2px solid white', zIndex: 10
                            }}>
                              {iIdx + 1}
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = variant.images.filter((_: string, idx: number) => idx !== iIdx);
                                handleVariantChange(vIdx, 'images', newImages);
                              }}
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

                            {/* Mobile Reorder Controls */}
                            <>
                              <button
                                type="button"
                                disabled={iIdx === 0}
                                onClick={(e) => { e.preventDefault(); moveVariantImage(vIdx, iIdx, 'left'); }}
                                className="md:hidden z-10 disabled:opacity-30 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]"
                                style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '2px', background: 'transparent', border: 'none', padding: 0 }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                              </button>
                              <button
                                type="button"
                                disabled={iIdx === variant.images.length - 1}
                                onClick={(e) => { e.preventDefault(); moveVariantImage(vIdx, iIdx, 'right'); }}
                                className="md:hidden z-10 disabled:opacity-30 drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)]"
                                style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '2px', background: 'transparent', border: 'none', padding: 0 }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                              </button>
                            </>
                          </div>
                        ))}
                      </div>
                    )}
                    {(!variant.images || variant.images.length === 0) && (
                      <div className="text-xs text-stone-400 italic mt-2">No images added for this variant yet.</div>
                    )}
                  </div>
                </div>
               )}
               </div>
               );
            })}
            <div className="flex justify-start">
              <button type="button" onClick={addVariant} className="btn-primary px-5 py-2 md:px-6 md:py-2.5 rounded-xl text-sm md:text-base font-bold text-white shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2" style={{ background: "var(--brand)", width: "fit-content" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add New Variant
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 pt-4 md:pt-8 mt-4 md:mt-8 border-t border-[#C4A484] w-full">
        <div className="flex gap-4 w-full justify-center">
          <button type="submit" disabled={loading} className="btn-primary" style={{ flexGrow: 1, flexBasis: 'auto', maxWidth: '200px', border: 'none', minHeight: '50px' }}>
            {isEdit ? "Update Product" : "Save New Product"}
          </button>
          
          <button type="button" onClick={() => router.back()} className="btn-secondary" style={{ flexGrow: 1, flexBasis: 'auto', maxWidth: '200px', border: '1px solid #E6DCCF', minHeight: '50px', backgroundColor: '#FDFBF7', color: '#4A3219' }}>
            Cancel
          </button>
        </div>

        {isEdit && (
          <div className="flex w-full justify-center">
            <button 
              type="button" 
              onClick={handleDelete} 
              disabled={loading}
              className="btn-outline" 
              style={{ width: '100%', maxWidth: '416px', border: '1px solid #dc2626', color: '#dc2626', minHeight: '50px' }}
            >
              Delete Product
            </button>
          </div>
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
