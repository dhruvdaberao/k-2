import { Product } from "@/types";
import { Category } from "./categoriesApi";

export interface DiscountInfo {
  isActive: boolean;
  originalPrice: number;
  effectivePrice: number;
  discountPercentage: number;
  discountType: 'category' | 'product' | 'none';
}

/**
 * Calculates the final effective price of a product, taking into account
 * category-level discounts (which take precedence) and product-level discounts.
 */
export function calculateDiscountInfo(product: Product, categories: Category[]): DiscountInfo {
  const originalPrice = product.price || 0;
  
  // Find the product's category
  const activeCategory = categories.find(c => c.name === product.category);
  
  // 1. Check Category Discount First
  if (activeCategory?.discount_active && activeCategory?.discount_percentage) {
    const percentage = Number(activeCategory.discount_percentage);
    return {
      isActive: true,
      originalPrice,
      effectivePrice: Math.round(originalPrice - (originalPrice * percentage / 100)),
      discountPercentage: percentage,
      discountType: 'category'
    };
  }
  
  // 2. Check Product Discount Next
  if (product.discount_active && product.discount_percentage) {
    const percentage = Number(product.discount_percentage);
    return {
      isActive: true,
      originalPrice,
      effectivePrice: Math.round(originalPrice - (originalPrice * percentage / 100)),
      discountPercentage: percentage,
      discountType: 'product'
    };
  }
  
  // 3. No Discount
  return {
    isActive: false,
    originalPrice,
    effectivePrice: originalPrice,
    discountPercentage: 0,
    discountType: 'none'
  };
}
