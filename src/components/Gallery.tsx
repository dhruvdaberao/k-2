"use client";
import React from "react";

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
        <img src={list[active]} alt={alt} className="pdp-gallery__image product-image" />
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
              <img src={src} alt={`${alt} thumbnail ${i + 1}`} className="pdp-gallery__thumb-image" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
