"use client";

import { useState } from "react";

export default function WhyHandmadeSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mb-10 md:mb-16 text-center max-w-3xl mx-auto">
      <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6" style={{ color: "var(--text)" }}>
        Why Handmade?
      </h2>
      <p className="text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
        Handmade isn’t just about how something is made — it’s about the care behind it.
        Every piece at Keshvi Crafts is created slowly, thoughtfully, and with intention.
        Unlike mass-produced items, handmade crochet carries warmth, individuality, and soul.
      </p>
      
      <div style={{ position: "relative" }}>
        <div style={{
          maxHeight: expanded ? "1000px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.4s ease",
          opacity: expanded ? 1 : 0,
          transitionProperty: "max-height, opacity",
          transitionDuration: "0.4s",
        }}>
          <div className="mt-8 text-left max-w-2xl mx-auto space-y-6 pb-4">
            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: "rgba(139, 94, 60, 0.1)", color: "var(--brand)" }}>1</span>
              <div>
                <strong className="block text-lg mb-1" style={{ color: "var(--text)" }}>Made to order, not mass produced</strong>
                <p className="leading-relaxed" style={{ color: "var(--muted)" }}>Each item is started only after you place an order, reducing waste and ensuring it&apos;s made just for you.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: "rgba(139, 94, 60, 0.1)", color: "var(--brand)" }}>2</span>
              <div>
                <strong className="block text-lg mb-1" style={{ color: "var(--text)" }}>Crafted with care & attention</strong>
                <p className="leading-relaxed" style={{ color: "var(--muted)" }}>Our artisans spend hours perfecting every stitch, ensuring quality that machines simply can&apos;t match.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ background: "rgba(139, 94, 60, 0.1)", color: "var(--brand)" }}>3</span>
              <div>
                <strong className="block text-lg mb-1" style={{ color: "var(--text)" }}>Truly unique to you</strong>
                <p className="leading-relaxed" style={{ color: "var(--muted)" }}>No two handmade pieces are exactly alike. Your item carries individuality, warmth, and soul.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-2">
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            margin: "1rem 0",
            padding: "0.6rem 1.5rem",
            background: "none",
            border: "1.5px solid var(--brand)",
            borderRadius: "999px",
            color: "var(--brand)",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "inherit",
          }}
        >
          {expanded ? "Show Less ↑" : "Read More ↓"}
        </button>
      </div>
    </section>
  );
}
