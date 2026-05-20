"use client";

import { useRef } from "react";
import { injectInitialRatings } from "@/lib/ratingCache";

export default function RatingHydrator({ 
  initialRatings 
}: { 
  initialRatings: Record<string, { avg: string | null; count: number }> 
}) {
  const inited = useRef(false);
  if (!inited.current) {
    injectInitialRatings(initialRatings);
    inited.current = true;
  }
  return null;
}
