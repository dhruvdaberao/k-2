"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getLiveCategories, Category } from "@/lib/categoriesApi";

export default function CategoryChips({ serverCategory, liveCategories = [] }: { serverCategory?: string, liveCategories?: Category[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeCategory = serverCategory || searchParams.get("category");

    const categories = liveCategories || [];

    const handleCategoryClick = (category: Category | null) => {
        if (category) {
            router.push(`/collections/${category.slug}`);
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
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className={`category-chip ${activeCategory === cat.name ? "active" : ""}`}
                    >
                        {cat.name}
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
