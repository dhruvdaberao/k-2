"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Category } from "@/lib/categoriesApi";

export default function CategoryChips({ serverCategory, liveCategories = [] }: { serverCategory?: string, liveCategories?: Category[] }) {
    const searchParams = useSearchParams();
    const activeCategory = serverCategory || searchParams.get("category");
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const categories = liveCategories || [];

    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeEl = scrollContainerRef.current.querySelector('.active') as HTMLElement;
            if (activeEl) {
                const container = scrollContainerRef.current;
                const scrollLeft = activeEl.offsetLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
                setTimeout(() => {
                    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }, 50);
            }
        }
    }, [activeCategory]);

    return (
        <div className="category-chips-container">
            <div className="category-chips-scroll" ref={scrollContainerRef}>
                <Link
                    href={`/collections`}
                    scroll={false}
                    className={`category-chip ${!activeCategory ? "active" : ""}`}
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                    All
                </Link>
                {categories.map((cat) => (
                    <Link
                        key={cat.id}
                        href={`/collections/${cat.slug}`}
                        scroll={false}
                        className={`category-chip ${activeCategory === cat.name ? "active" : ""}`}
                        style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                    >
                        {cat.name}
                    </Link>
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
