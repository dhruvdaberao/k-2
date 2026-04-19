"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import products from "@/data/products.json";
import type { Product } from "@/types";
import "./SearchModal.css";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Live filter results
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();
    return (products as Product[])
      .filter(p => (p.status ?? 'live') !== 'hidden' && !p.isVariant)
      .filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.category?.toLowerCase().includes(q) ||
        p.tags?.some(tag => tag.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (query.trim()) {
      router.push(`/collections?q=${encodeURIComponent(query)}`);
      onClose();
    }
  };

  return (
    <div className="search-overlay" onClick={onClose}>
      <div className="search-header">
        <button className="close-search-btn" onClick={onClose} aria-label="Close search">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          Close
        </button>
      </div>

      <div className="search-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="search-title">What are you looking for?</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="search-input-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search products, collections, colors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="search-live-results">
          {query.length >= 1 && results.length > 0 && (
            <div className="results-grid">
              {results.map(product => (
                <Link 
                  key={product.slug} 
                  href={`/products/${product.slug}`}
                  onClick={onClose}
                  className="search-result-item"
                >
                  <div className="result-image">
                    <Image 
                      src={product.images?.[0] || "/placeholder.png"} 
                      alt={product.title}
                      width={60}
                      height={60}
                      className="object-cover rounded-lg"
                    />
                  </div>
                  <div className="result-info">
                    <h4 className="result-name">{product.title}</h4>
                    <p className="result-price">₹{product.price}</p>
                    <span className="result-cat">{product.category}</span>
                  </div>
                </Link>
              ))}
              <button 
                onClick={handleSubmit}
                type="button"
                className="view-all-results"
              >
                View all results for &quot;{query}&quot; →
              </button>
            </div>
          )}

          {query.length >= 1 && results.length === 0 && (
            <div className="search-empty-state">
              <p className="no-results-msg">No products found</p>
              <p className="try-else-msg">Try searching something else</p>
            </div>
          )}

          {query.length < 1 && (
             <div className="search-hint">Start typing to see instant results</div>
          )}
        </div>
      </div>
    </div>
  );
}
