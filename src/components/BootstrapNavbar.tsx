"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
      <nav className="keshvi-nav top-navbar">
        <div className="nav-inner">
          <Link href="/" className="brand header-left logo" aria-label="Keshvi Crafts — Home">
            <Image
              src="/uploads/hero/logo.png"
              alt="Keshvi Crafts Logo"
              width={160}
              height={56}
              className="logo-img"
              priority={true}
              style={{ objectFit: "contain" }}
            />
          </Link>

          <div className="nav-icons header-right">
            <div className="desktop-links">
              <Link href="/" className={`nav-item ${isActive("/") ? "active" : ""}`} title="Home">
                <span className="nav-label">Home</span>
              </Link>
              <Link href="/search" className={`nav-item ${isActive("/search") ? "active" : ""}`} title="Search">
                <span className="nav-label">Search</span>
              </Link>
              <Link href="/collections" className={`nav-item ${isActive("/collections") ? "active" : ""}`} title="Collections">
                <span className="nav-label">Collections</span>
              </Link>
              <Link
                href="/wishlist"
                className={`nav-item ${isActive("/wishlist") ? "active" : ""}`}
                title="Wishlist"
                aria-label={wishlistAriaLabel}
              >
                <div className="wishlist-wrapper">
                  <span className="nav-label">Wishlist</span>
                  <WishlistBadge />
                </div>
              </Link>
              <Link href="/cart" className={`nav-item ${isActive("/cart") ? "active" : ""}`} title="Cart">
                <div className="cart-wrapper-text">
                  <span className="nav-label">Cart</span>
                  <CartBadge />
                </div>
              </Link>
              <Link href={authLink} className={`nav-item ${isActive(authLink) ? "active" : ""}`} title={user ? "Profile" : "Login"}>
                <span className="nav-label">{user ? "Profile" : "Login"}</span>
              </Link>
            </div>

            <Link
              href="/search"
              className={`mobile-top-search ${isActive("/search") ? "active" : ""}`}
              aria-label="Open search"
              title="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </Link>
            
            <Link
              href={authLink}
              className={`mobile-top-profile ${isActive(authLink) ? "active" : ""}`}
              aria-label={user ? "User Profile" : "Login"}
              title={user ? "Profile" : "Login"}
              style={{ alignItems: "center", marginLeft: "12px" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="profile-icon"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </Link>
          </div>
        </div>
      </nav>

      <div className="mobile-bottom-nav">
        <Link href="/" className={`bottom-nav-item ${isActive("/") ? "active" : ""}`} title="Home">
          {isActive("/") ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="bottom-nav-icon" stroke="none"><path d="M12 3L2 12h3v8h5v-6h4v6h5v-8h3L12 3z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          )}
          <span className="bottom-nav-label">Home</span>
        </Link>

        <Link href="/collections" className={`bottom-nav-item ${isActive("/collections") ? "active" : ""}`} title="Collections">
          {isActive("/collections") ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="bottom-nav-icon" stroke="none"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          )}
          <span className="bottom-nav-label">Collections</span>
        </Link>

        <Link href="/wishlist" className={`bottom-nav-item ${isActive("/wishlist") ? "active" : ""}`} title="Wishlist">
          <div className="wishlist-wrapper" style={{ position: "relative" }}>
            {isActive("/wishlist") ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="bottom-nav-icon" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            )}
            <WishlistBadge size="sm" />
          </div>
          <span className="bottom-nav-label bottom-nav-label--wishlist">Wishlist</span>
        </Link>

        <Link href="/cart" className={`bottom-nav-item cart-bottom ${isActive("/cart") ? "active" : ""}`} title="Cart">
          <div className="cart-wrapper">
            {isActive("/cart") ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="bottom-nav-icon" stroke="none"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            )}
            <CartBadge size="sm" />
          </div>
          <span className="bottom-nav-label">Cart</span>
        </Link>
      </div>
    </>
  );
}
