// app/collections/page.tsx
import { Suspense } from "react";
import CollectionsContent from "@/components/CollectionsContent";

export default function CollectionsPage() {
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
        <CollectionsContent />
      </Suspense>
    </div>
  );
}
