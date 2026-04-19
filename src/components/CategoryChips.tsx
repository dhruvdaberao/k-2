"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { DISPLAY_CATEGORIES, CATEGORY_SLUGS } from "@/lib/categories";

export default function CategoryChips({ serverCategory }: { serverCategory?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeCategory = serverCategory || searchParams.get("category");

    const handleCategoryClick = (category: string | null) => {
        if (category) {
            const slug = CATEGORY_SLUGS[category];
            router.push(`/collections/${slug}`);
        } else {
            router.push(`/collections`);
        }
    };

    return (
        <div className="category-chips-container">
            <div className="category-chips-scroll">
                <button
                    onClick={() => handleCategoryClick(null)}
                    className={`category-chip ${!activeCategory ? "active" : ""}`}
                >
                    All
                </button>
                {DISPLAY_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => handleCategoryClick(cat)}
                        className={`category-chip ${activeCategory === cat ? "active" : ""}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            <span className="category-chips-arrow-hint" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                </svg>
            </span>
        </div>
    );
}
