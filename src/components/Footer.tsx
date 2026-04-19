"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner" style={{ textAlign: "center" }}>
        <div style={{
          display: "grid",
          gap: "2.5rem",
          gridTemplateColumns: "repeat(4, 1fr)",
        }} className="footer-responsive-grid">
          {/* About */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 className="footer-title">About Keshvi Crafts</h3>
            <p className="footer-text" style={{ marginBottom: "1.5rem", maxWidth: "400px" }}>
              Handmade crochet and artisanal pieces crafted with care in India.
              Each item is made to order, ensuring quality and thoughtfulness in every stitch.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center" }}>
              <div>
                <span className="footer-meta-label">Founder</span>
                <span className="footer-text font-medium" style={{ display: "block" }}>Vaishnavi Sharma</span>
              </div>
              <div style={{ maxWidth: "300px" }}>
                <span className="footer-meta-label">Studio</span>
                <p className="footer-text" style={{ margin: 0 }}>
                  167 L, In Front of Indane Gas Godam,<br />
                  New Colony, Madhopur, Surajkund,<br />
                  Gorakhpur, Uttar Pradesh - 273015
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links" style={{ padding: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/collections">Collections</Link></li>
              <li><Link href="/wishlist">Wishlist</Link></li>
              <li><Link href="/cart">Cart</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 className="footer-title">Policies</h3>
            <ul className="footer-links" style={{ padding: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <li><Link href="/shipping">Shipping Policy</Link></li>
              <li><Link href="/returns">Return &amp; Exchange Policy</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 className="footer-title">Contact Us</h3>
            <ul className="footer-links" style={{ padding: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <li><Link href="/contact">Contact Page</Link></li>
              <li>
                <a href="https://ig.me/m/keshvi_crafts" target="_blank" rel="noopener noreferrer">
                  Instagram Support
                </a>
              </li>
              <li>
                <a href="mailto:KESHVICRAFTS@gmail.com">Email Us</a>
              </li>
            </ul>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span className="footer-text" style={{ marginBottom: "0.5rem", display: "block" }}>
                Follow Us
              </span>
              <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
                <a href="https://www.instagram.com/keshvi_crafts/" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-link">
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "3rem", borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: "1.5rem" }}>
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} Keshvi Crafts. All rights reserved.
          </p>
          <p className="footer-text" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
            Handmade in India
          </p>
        </div>
      </div>

      {/* Responsive footer grid CSS */}
      <style jsx>{`
        .footer-responsive-grid {
          grid-template-columns: repeat(4, 1fr) !important;
        }
        @media (max-width: 1024px) {
          .footer-responsive-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 600px) {
          .footer-responsive-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
