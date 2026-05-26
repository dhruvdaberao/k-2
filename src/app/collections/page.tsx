// app/collections/page.tsx
import { Suspense } from "react";
import CollectionsContent from "@/components/CollectionsContent";
import { getLiveProducts } from "@/lib/productsApi";

export const revalidate = 60;

export default async function CollectionsPage() {
  const liveProducts = await getLiveProducts();
  return (
    <div className="container collections-page">
      <Suspense fallback={
        <div className="collections-header">
          <h1 className="collections-title">All Collections</h1>
          <div className="collections-control-bar">
            <div className="collections-result-count">Loading...</div>
          </div>
        </div>
      }>
        <CollectionsContent liveProducts={liveProducts as any[]} />
      </Suspense>
    </div>
  );
}
