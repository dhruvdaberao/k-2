"use client";

import { useState } from "react";

interface SeoContent {
  intro?: string;
  materials?: string;
  craftsmanship?: string;
  useCases?: string;
  care?: string;
  faqs?: Array<{ q: string; a: string }>;
}

export default function SeoContentSection({ seoContent }: { seoContent: SeoContent }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="text-base md:text-xl lg:text-3xl text-stone-600 pdp-desc-text" style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
      {/* Always show intro */}
      {seoContent.intro && (
        <p className="mb-4 md:mb-6" style={{ lineHeight: 1.8 }}>{seoContent.intro}</p>
      )}

      {/* Collapsible content */}
      <div style={{ position: "relative" }}>
        <div style={{
          maxHeight: expanded ? "none" : "0px",
          overflow: "hidden",
          transition: "max-height 0.4s ease",
          lineHeight: 1.8,
        }}>
          {seoContent.materials && (
            <>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#4A3219] mb-4 md:mb-6">Materials Used</h3>
              <p className="mb-6 md:mb-8">{seoContent.materials}</p>
            </>
          )}

          {seoContent.craftsmanship && (
            <>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#4A3219] mb-4 md:mb-6">Craftsmanship Details</h3>
              <p className="mb-6 md:mb-8">{seoContent.craftsmanship}</p>
            </>
          )}

          {seoContent.useCases && (
            <>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#4A3219] mb-4 md:mb-6">Use Cases</h3>
              <p className="mb-6 md:mb-8">{seoContent.useCases}</p>
            </>
          )}

          {seoContent.care && (
            <>
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#4A3219] mb-4 md:mb-6">Care Instructions</h3>
              <p className="mb-6 md:mb-8">{seoContent.care}</p>
            </>
          )}

          {seoContent.faqs && seoContent.faqs.length > 0 && (
            <>
              <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-[#4A3219] mb-4 md:mb-6">Frequently Asked Questions</h3>
              <div className="flex flex-col gap-6 md:gap-8">
                {seoContent.faqs.map((faq, i) => (
                  <div key={i}>
                    <h4 className="text-base md:text-xl lg:text-2xl font-bold mb-2 md:mb-3 text-[#2f2a26]">{faq.q}</h4>
                    <p className="m-0">{faq.a}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Fade effect when collapsed */}
        {!expanded && (
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "40px",
            background: "linear-gradient(transparent, var(--bg))",
            pointerEvents: "none",
          }} />
        )}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="btn-secondary rounded-full mt-4 md:mt-6 px-6 py-2 md:px-8 md:py-3 text-sm md:text-lg lg:text-xl font-bold border-2 border-[var(--brand)] text-[var(--brand)] cursor-pointer"
      >
        {expanded ? "Show Less ↑" : "Read More ↓"}
      </button>
    </div>
  );
}
