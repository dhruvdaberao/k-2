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
  const list = images?.length ? images : ["/placeholder.png"];
  const [active, setActive] = React.useState(0);
  return (
    <div className="pdp-gallery">
      <div className="pdp-gallery__stage">
        <ImageWithFallback 
          src={list[active]} 
          alt={alt} 
          className="pdp-gallery__image product-image" 
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          priority
        />
        {heartButton}
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
