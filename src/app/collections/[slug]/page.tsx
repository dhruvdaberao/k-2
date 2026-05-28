// app/collections/[slug]/page.tsx
import { Suspense } from "react";
import CollectionsContent from "@/components/CollectionsContent";
import { notFound } from "next/navigation";
import { getLiveProducts } from "@/lib/productsApi";
import { getLiveCategories } from "@/lib/categoriesApi";

export const revalidate = 3600;

export default async function CategoryCollectionsPage({ params }: { params: { slug: string } }) {
    const targetSlug = params.slug.toLowerCase();
    const categories = await getLiveCategories();
    const category = categories.find((c) => (c.slug || '').toLowerCase() === targetSlug);
    
    if (!category) {
        return (
            <div className="container collections-page">
                <div className="collections-header">
                    <h1 className="collections-title capitalize">{targetSlug.replace(/-/g, ' ')}</h1>
                </div>
                <div className="py-20 text-center">
                    <h2 className="text-2xl font-bold text-[#4A3219] mb-4">No products found</h2>
                    <p className="text-[#8B7355]">We don't have any products in this category yet. Check back soon!</p>
                </div>
            </div>
        );
    }
    
    const categoryName = category.name;

    const liveProducts = await getLiveProducts();

    return (
        <div className="container collections-page">
            <Suspense fallback={
                <div className="collections-header">
                    <h1 className="collections-title">{categoryName} Collection</h1>
                    <div className="collections-control-bar">
                        <div className="collections-result-count">Loading...</div>
                    </div>
                </div>
            }>
                <CollectionsContent serverCategory={categoryName} liveProducts={liveProducts as any[]} liveCategories={categories as any[]} />
            </Suspense>
        </div>
    );
}
