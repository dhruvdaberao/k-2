"use client";

import { useState, useEffect } from "react";

const announcements = [
  "Free Shipping on all orders above ₹999",
  "Handcrafted with love, just for you",
  "100% Authentic Artisanal Crochet Pieces"
];

export default function AnnouncementBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="announcement-banner">
      {announcements.map((text, index) => (
        <div
          key={index}
          className={`announcement-text ${index === currentIndex ? "active" : ""}`}
        >
          {text}
        </div>
      ))}
    </div>
  );
}
