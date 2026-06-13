"use client";
import React from "react";
import ImageWithFallback from "./ImageWithFallback";

export default function Gallery({
  images = [],
  alt = "",
  heartButton,
}: {
  images: string[];
  alt?: string;
  heartButton?: React.ReactNode;
}) {
  const validImages = images?.filter(img => typeof img === 'string' && img.trim() !== '' && img.trim() !== 'null' && img.trim() !== 'undefined');
  const list = validImages?.length ? validImages : ["/placeholder.png"];
  const [active, setActive] = React.useState(0);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && list.length > 1) {
      setActive(prev => (prev === list.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe && list.length > 1) {
      setActive(prev => (prev === 0 ? list.length - 1 : prev - 1));
    }
  };

  return (
    <div className="pdp-gallery">
      <div 
        className="pdp-gallery__stage"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ImageWithFallback 
          src={list[active]} 
          alt={alt} 
          className="pdp-gallery__image product-image" 
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          priority
        />
        {heartButton}
        
        {/* Mobile Pagination Dots */}
        {list.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 md:hidden">
            {list.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
      {list.length > 1 && (
        <div className="pdp-gallery__thumbs">
          {list.map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={`pdp-gallery__thumb ${i === active ? "is-active" : ""}`}
              aria-label={`Show image ${i + 1}`}
            >
              <ImageWithFallback 
                src={src} 
                alt={`${alt} thumbnail ${i + 1}`} 
                className="pdp-gallery__thumb-image" 
                width={80}
                height={80}
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
