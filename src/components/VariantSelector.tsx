"use client";

import { ProductVariant } from "@/types";
import { useState } from "react";

export default function VariantSelector({
  variants,
  onSelect,
  selectedVariant,
}: {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
  selectedVariant: ProductVariant | null;
}) {
  if (!variants || variants.length === 0) return null;

  return (
    <div className="variant-selector">
      <label className="variant-label">Select Variant:</label>
      <div className="variant-options">
        {variants.map((variant) => (
          <button
            key={variant.slug}
            type="button"
            className={`variant-btn ${selectedVariant?.slug === variant.slug ? "active" : ""}`}
            onClick={() => onSelect(variant)}
          >
            {variant.name}
            {variant.price && (
              <span className="variant-price">₹{variant.price}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}


