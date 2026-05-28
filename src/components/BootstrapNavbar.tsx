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
              <Image src={isActive("/search") ? "/nav-icons/search-filled.png" : "/nav-icons/search-unfilled.png"} alt="Search" width={22} height={22} className="search-icon" />
            </Link>
            
            <Link
              href={authLink}
              className={`mobile-top-profile ${isActive(authLink) ? "active" : ""}`}
              aria-label={user ? "User Profile" : "Login"}
              title={user ? "Profile" : "Login"}
              style={{ alignItems: "center", marginLeft: "12px" }}
            >
              <Image src={isActive(authLink) ? "/nav-icons/profile-filled.png" : "/nav-icons/profile-unfilled.png"} alt="Profile" width={22} height={22} className="profile-icon" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="mobile-bottom-nav">
        <Link href="/" className={`bottom-nav-item ${isActive("/") ? "active" : ""}`} title="Home">
          <Image src={isActive("/") ? "/nav-icons/home-filled.png" : "/nav-icons/home-unfilled.png"} alt="Home" width={24} height={24} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Home</span>
        </Link>

        <Link href="/collections" className={`bottom-nav-item ${isActive("/collections") ? "active" : ""}`} title="Collections">
          <Image src={isActive("/collections") ? "/nav-icons/category-filled.png" : "/nav-icons/category-unfilled.png"} alt="Collections" width={24} height={24} className="bottom-nav-icon" />
          <span className="bottom-nav-label">Collections</span>
        </Link>

        <Link href="/wishlist" className={`bottom-nav-item ${isActive("/wishlist") ? "active" : ""}`} title="Wishlist">
          <div className="wishlist-wrapper" style={{ position: "relative" }}>
            <Image src={isActive("/wishlist") ? "/nav-icons/heart-filled.png" : "/nav-icons/heart-unfilled.png"} alt="Wishlist" width={24} height={24} className="bottom-nav-icon" />
            <WishlistBadge size="sm" />
          </div>
          <span className="bottom-nav-label bottom-nav-label--wishlist">Wishlist</span>
        </Link>

        <Link href="/cart" className={`bottom-nav-item cart-bottom ${isActive("/cart") ? "active" : ""}`} title="Cart">
          <div className="cart-wrapper">
            <Image src={isActive("/cart") ? "/nav-icons/bag-filled.png" : "/nav-icons/bag-unfilled.png"} alt="Cart" width={24} height={24} className="bottom-nav-icon" />
            <CartBadge size="sm" />
          </div>
          <span className="bottom-nav-label">Cart</span>
        </Link>
      </div>
    </>
  );
}
