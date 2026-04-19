// app/collections/[slug]/page.tsx
import { Suspense } from "react";
import CollectionsContent from "@/components/CollectionsContent";
import { SLUG_TO_CATEGORY } from "@/lib/categories";
import { notFound } from "next/navigation";

export const dynamicParams = false;

export async function generateStaticParams() {
    return [
        { slug: "forever-blooms" },
        { slug: "soft-fits" },
        { slug: "home-feelings" },
        { slug: "carry-stories" },
        { slug: "little-things" },
    ];
}

export default function CategoryCollectionsPage({ params }: { params: { slug: string } }) {
    const categoryName = SLUG_TO_CATEGORY[params.slug];
    if (!categoryName) {
        notFound();
    }

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
                <CollectionsContent serverCategory={categoryName} />
            </Suspense>
        </div>
    );
}
