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
    <div style={{ marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid var(--border)" }}>
      {/* Always show intro */}
      {seoContent.intro && (
        <p style={{ lineHeight: 1.8, marginBottom: "1rem" }}>{seoContent.intro}</p>
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
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.8rem", color: "var(--brand)" }}>Materials Used</h3>
              <p style={{ marginBottom: "1.5rem" }}>{seoContent.materials}</p>
            </>
          )}

          {seoContent.craftsmanship && (
            <>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.8rem", color: "var(--brand)" }}>Craftsmanship Details</h3>
              <p style={{ marginBottom: "1.5rem" }}>{seoContent.craftsmanship}</p>
            </>
          )}

          {seoContent.useCases && (
            <>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.8rem", color: "var(--brand)" }}>Use Cases</h3>
              <p style={{ marginBottom: "1.5rem" }}>{seoContent.useCases}</p>
            </>
          )}

          {seoContent.care && (
            <>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.8rem", color: "var(--brand)" }}>Care Instructions</h3>
              <p style={{ marginBottom: "1.5rem" }}>{seoContent.care}</p>
            </>
          )}

          {seoContent.faqs && seoContent.faqs.length > 0 && (
            <>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem", color: "var(--brand)" }}>Frequently Asked Questions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {seoContent.faqs.map((faq, i) => (
                  <div key={i}>
                    <h4 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.4rem" }}>{faq.q}</h4>
                    <p style={{ margin: 0 }}>{faq.a}</p>
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

      {/* Toggle Button */}
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
  );
}
