// app/collections/page.tsx
import { Suspense } from "react";
import CollectionsContent from "@/components/CollectionsContent";
import { getLiveProducts } from "@/lib/productsApi";

export const revalidate = 3600;

export default async function CollectionsPage() {
  const [liveProducts, liveCategories] = await Promise.all([
    getLiveProducts(),
    import("@/lib/categoriesApi").then(m => m.getLiveCategories())
  ]);
  
  return (
    <div className="container collections-page">
      <Suspense fallback={
        <>
          <div className="collections-header text-center">
            <h1 className="collections-title">Collections</h1>
          </div>
          <div className="plp-grid-mobile mt-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse bg-[#f1ebe6] rounded-2xl w-full aspect-[4/5]"></div>
            ))}
          </div>
        </>
      }>
        <CollectionsContent liveProducts={liveProducts as any[]} liveCategories={liveCategories as any[]} />
      </Suspense>
    </div>
  );
}
