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
              <Link href="/" prefetch={true} className={`nav-item ${isActive("/") ? "active" : ""}`} title="Home">
                <span className="nav-label">Home</span>
              </Link>
              <Link href="/search" prefetch={true} className={`nav-item ${isActive("/search") ? "active" : ""}`} title="Search">
                <span className="nav-label">Search</span>
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
              <Link href="/cart" prefetch={true} className={`nav-item ${isActive("/cart") ? "active" : ""}`} title="Cart">
                <div className="cart-wrapper-text">
                  <span className="nav-label">Cart</span>
                  <CartBadge />
                </div>
              </Link>
              <Link href={authLink} prefetch={true} className={`nav-item ${isActive(authLink) ? "active" : ""}`} title={user ? "Profile" : "Login"}>
                <span className="nav-label">{user ? "Profile" : "Login"}</span>
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
                <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              )}
            </Link>
            
            <Link
              href={authLink}
              prefetch={true}
              className={`mobile-top-profile ${isActive(authLink) ? "active" : ""}`}
              aria-label={user ? "User Profile" : "Login"}
              title={user ? "Profile" : "Login"}
              style={{ alignItems: "center", marginLeft: "12px" }}
            >
              {isActive(authLink) ? (
                <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2z"/><circle cx="12" cy="7" r="4"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="profile-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <div className="mobile-bottom-nav">
        <Link href="/" prefetch={true} className={`bottom-nav-item ${isActive("/") ? "active" : ""}`} title="Home">
          {isActive("/") ? (
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          )}
          <span className="bottom-nav-label">Home</span>
        </Link>

        <Link href="/collections" prefetch={true} className={`bottom-nav-item ${isActive("/collections") ? "active" : ""}`} title="Collections">
          {isActive("/collections") ? (
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          )}
          <span className="bottom-nav-label">Collections</span>
        </Link>

        <Link href="/wishlist" prefetch={true} className={`bottom-nav-item ${isActive("/wishlist") ? "active" : ""}`} title="Wishlist">
          <div className="wishlist-wrapper" style={{ position: "relative" }}>
            {isActive("/wishlist") ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="#5a3e2b" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            )}
            <WishlistBadge size="sm" />
          </div>
          <span className="bottom-nav-label bottom-nav-label--wishlist">Wishlist</span>
        </Link>

        <Link href="/cart" prefetch={true} className={`bottom-nav-item cart-bottom ${isActive("/cart") ? "active" : ""}`} title="Cart">
          <div className="cart-wrapper">
            {isActive("/cart") ? (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><circle cx="9" cy="21" r="1" fill="#5a3e2b"/><circle cx="20" cy="21" r="1" fill="#5a3e2b"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#5a3e2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="bottom-nav-icon"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            )}
            <CartBadge size="sm" />
          </div>
          <span className="bottom-nav-label">Cart</span>
        </Link>
      </div>
    </>
  );
}
