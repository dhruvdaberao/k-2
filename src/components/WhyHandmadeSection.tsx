"use client";

import { useState } from "react";

export default function WhyHandmadeSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="mb-8 md:mb-16 mt-8 md:mt-12 text-center max-w-4xl mx-auto px-4">
      <h2 className="home-section-title font-bold mb-4 md:mb-8" style={{ color: "var(--text)" }}>
        Why Handmade?
      </h2>
      <p className="text-lg md:text-xl lg:text-2xl leading-relaxed" style={{ color: "var(--muted)" }}>
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
          <div className="mt-8 md:mt-16 text-center max-w-2xl lg:max-w-4xl mx-auto space-y-10 md:space-y-14 lg:space-y-16 pb-4 md:pb-8">
            <div className="flex flex-col items-center gap-4 md:gap-6 lg:gap-8">
              <span className="flex-shrink-0 w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 text-lg md:text-2xl lg:text-3xl rounded-full flex items-center justify-center font-bold shadow-sm" style={{ background: "rgba(139, 94, 60, 0.1)", color: "var(--brand)" }}>1</span>
              <div>
                <strong className="block text-xl md:text-3xl lg:text-4xl mb-2 md:mb-4 lg:mb-5" style={{ color: "var(--text)" }}>Made to order, not mass produced</strong>
                <p className="leading-relaxed text-lg md:text-xl lg:text-2xl max-w-lg lg:max-w-2xl mx-auto" style={{ color: "var(--muted)" }}>Each item is started only after you place an order, reducing waste and ensuring it&apos;s made just for you.</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 md:gap-6 lg:gap-8">
              <span className="flex-shrink-0 w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 text-lg md:text-2xl lg:text-3xl rounded-full flex items-center justify-center font-bold shadow-sm" style={{ background: "rgba(139, 94, 60, 0.1)", color: "var(--brand)" }}>2</span>
              <div>
                <strong className="block text-xl md:text-3xl lg:text-4xl mb-2 md:mb-4 lg:mb-5" style={{ color: "var(--text)" }}>Crafted with care & attention</strong>
                <p className="leading-relaxed text-lg md:text-xl lg:text-2xl max-w-lg lg:max-w-2xl mx-auto" style={{ color: "var(--muted)" }}>Our artisans spend hours perfecting every stitch, ensuring quality that machines simply can&apos;t match.</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 md:gap-6 lg:gap-8">
              <span className="flex-shrink-0 w-10 h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 text-lg md:text-2xl lg:text-3xl rounded-full flex items-center justify-center font-bold shadow-sm" style={{ background: "rgba(139, 94, 60, 0.1)", color: "var(--brand)" }}>3</span>
              <div>
                <strong className="block text-xl md:text-3xl lg:text-4xl mb-2 md:mb-4 lg:mb-5" style={{ color: "var(--text)" }}>Truly unique to you</strong>
                <p className="leading-relaxed text-lg md:text-xl lg:text-2xl max-w-lg lg:max-w-2xl mx-auto" style={{ color: "var(--muted)" }}>No two handmade pieces are exactly alike. Your item carries individuality, warmth, and soul.</p>
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
            fontSize: "1.1rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "inherit",
          }}
          className="md:px-8 md:py-3 md:text-xl"
        >
          {expanded ? "Show Less ↑" : "Read More ↓"}
        </button>
      </div>
    </section>
  );
}
