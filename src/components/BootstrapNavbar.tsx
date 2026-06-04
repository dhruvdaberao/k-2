"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabaseClient";
import CartBadge from "@/components/CartBadge";
import WishlistBadge from "@/components/WishlistBadge";
import "./Navbar.css";

export default function BootstrapNavbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const authLink = user ? "/profile" : "/auth";

  const isActive = (href: string): boolean =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href) ?? false;

  const wishlistAriaLabel = isActive("/wishlist")
    ? "Wishlist, current page"
    : "Wishlist";

  return (
    <>
      <nav className="keshvi-nav">
        <div className="top-navbar">
          <div className="nav-inner">
            <Link href="/" className="brand header-left" style={{ textDecoration: 'none' }} aria-label="Keshvi Crafts — Home">
              <img
                src="/nav-icons/logo.png"
                alt="Keshvi Crafts Logo"
                className="my-0"
                style={{ height: '46px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>

          <div className="nav-icons header-right">
            <div className="desktop-links">
              <Link href="/" prefetch={true} className={`nav-item ${isActive("/") ? "active" : ""}`} title="Home">
                <span className="nav-label">Home</span>
              </Link>
              <Link href="/collections" prefetch={true} className={`nav-item ${isActive("/collections") ? "active" : ""}`} title="Collections">
                <span className="nav-label">Collections</span>
              </Link>
              <Link
                href="/wishlist"
                prefetch={true}
                className={`nav-item ${isActive("/wishlist") ? "active" : ""}`}
                title="Wishlist"
                aria-label={wishlistAriaLabel}
              >
                <div className="wishlist-wrapper">
                  <span className="nav-label">Wishlist</span>
                  <WishlistBadge />
                </div>
              </Link>
              <Link href={authLink} prefetch={true} className={`nav-item ${isActive(authLink) ? "active" : ""}`} title={user ? "Profile" : "Login"}>
                <span className="nav-label">{user ? "Profile" : "Login"}</span>
              </Link>
              <Link href="/search" prefetch={true} className={`nav-item ${isActive("/search") ? "active" : ""}`} title="Search">
                <span className="nav-label">Search</span>
              </Link>
              <Link href="/cart" prefetch={true} className={`nav-item ${isActive("/cart") ? "active" : ""}`} title="Bag">
                <div className="cart-wrapper-text">
                  <span className="nav-label">Bag</span>
                  <CartBadge />
                </div>
              </Link>
            </div>

            <Link
              href="/search"
              prefetch={true}
              className={`mobile-top-search ${isActive("/search") ? "active" : ""}`}
              aria-label="Open search"
              title="Search"
            >
              {isActive("/search") ? (
                <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              )}
            </Link>
            
            <Link
              href="/cart"
              prefetch={true}
              className={`mobile-top-cart ${isActive("/cart") ? "active" : ""}`}
              aria-label="Shopping Bag"
              title="Bag"
              style={{ marginLeft: "12px" }}
            >
              <div className="cart-wrapper">
                {isActive("/cart") ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cart-icon"><rect x="2" y="8" width="20" height="14" rx="2" ry="2" fill="#5a3e2b"/><path d="M7 8V6a5 5 0 0 1 10 0v2" fill="none"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cart-icon"><rect x="2" y="8" width="20" height="14" rx="2" ry="2" fill="none"/><path d="M7 11V6a5 5 0 0 1 10 0v5" fill="none"/></svg>
                )}
                <CartBadge size="sm" />
              </div>
            </Link>
          </div>
        </div>
        </div>
      </nav>

      <div className="mobile-bottom-nav">
        <Link href="/" prefetch={true} className={`bottom-nav-item ${isActive("/") ? "active" : ""}`} title="Home">
          {isActive("/") ? (
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="M2 12q0-1.5 1.5-3l6-6q2.5-2.5 5 0l6 6q1.5 1.5 1.5 3v8q0 2-2 2h-2.5q-1.5 0-1.5-1.5v-4.5a4 4 0 0 0-8 0v4.5q0 1.5-1.5 1.5H4q-2 0-2-2Z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="M2 12q0-1.5 1.5-3l6-6q2.5-2.5 5 0l6 6q1.5 1.5 1.5 3v8q0 2-2 2h-2.5q-1.5 0-1.5-1.5v-4.5a4 4 0 0 0-8 0v4.5q0 1.5-1.5 1.5H4q-2 0-2-2Z"/></svg>
          )}
          <span className="bottom-nav-label">Home</span>
        </Link>

        <Link href="/collections" prefetch={true} className={`bottom-nav-item ${isActive("/collections") ? "active" : ""}`} title="Collections">
          {isActive("/collections") ? (
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><rect x="2" y="2" width="8" height="8" rx="2.5"/><rect x="14" y="2" width="8" height="8" rx="2.5"/><rect x="2" y="14" width="8" height="8" rx="2.5"/><rect x="14" y="14" width="8" height="8" rx="2.5"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><rect x="2" y="2" width="8" height="8" rx="2.5"/><rect x="14" y="2" width="8" height="8" rx="2.5"/><rect x="2" y="14" width="8" height="8" rx="2.5"/><rect x="14" y="14" width="8" height="8" rx="2.5"/></svg>
          )}
          <span className="bottom-nav-label">Collections</span>
        </Link>

        <Link href="/wishlist" prefetch={true} className={`bottom-nav-item ${isActive("/wishlist") ? "active" : ""}`} title="Wishlist">
          <div className="wishlist-wrapper" style={{ position: "relative" }}>
            {isActive("/wishlist") ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="M21.19 5.01a5.72 5.72 0 0 0-8.09 0L12 6.12l-1.1-1.1a5.72 5.72 0 0 0-8.09 8.09l1.1 1.1L9.92 20.22a2.94 2.94 0 0 0 4.16 0L20.09 14.21l1.1-1.1a5.72 5.72 0 0 0 0-8.1z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="M21.19 5.01a5.72 5.72 0 0 0-8.09 0L12 6.12l-1.1-1.1a5.72 5.72 0 0 0-8.09 8.09l1.1 1.1L9.92 20.22a2.94 2.94 0 0 0 4.16 0L20.09 14.21l1.1-1.1a5.72 5.72 0 0 0 0-8.1z"/></svg>
            )}
            <WishlistBadge size="sm" />
          </div>
          <span className="bottom-nav-label bottom-nav-label--wishlist">Wishlist</span>
        </Link>

        <Link href={authLink} prefetch={true} className={`bottom-nav-item ${isActive(authLink) ? "active" : ""}`} title={user ? "Profile" : "Login"}>
          {isActive(authLink) ? (
            <svg xmlns="http://www.w3.org/2000/svg" width={26} height={26} viewBox="1.5 1.5 21 21" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon profile-icon-svg"><path d="M19 21a1 1 0 0 0 1-1v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1a1 1 0 0 0 1 1z"/><circle cx="12" cy="7" r="4"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width={26} height={26} viewBox="1.5 1.5 21 21" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon profile-icon-svg"><path d="M19 21a1 1 0 0 0 1-1v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1a1 1 0 0 0 1 1z"/><circle cx="12" cy="7" r="4"/></svg>
          )}
          <span className="bottom-nav-label">{user ? "Profile" : "Login"}</span>
        </Link>
      </div>
    </>
  );
}
