"use client";

import { useState, useEffect } from "react";

const trustMessages = [
  "Handmade with care",
  "Made to order",
  "Secure payments",
  "Ships across India"
];

export default function TrustBar() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trustMessages.length);
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="trust-bar">
      <div className="trust-bar-inner">
        <div className="trust-message-container">
          {trustMessages.map((message, index) => (
            <span
              key={index}
              className={`trust-item ${index === currentIndex ? "active" : ""}`}
              aria-live="polite"
            >
              {message}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

