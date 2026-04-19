"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CartBadge from "@/components/CartBadge";

const links = [
  { href: "/", label: "Home" },
  { href: "/collections", label: "Collections" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cart", label: "Cart" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="container flex h-14 items-center gap-4">
        {/* Desktop nav - Grid Layout */}
        <nav className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-8 md:w-full">
          {/* Left: Home + Collections */}
          <div className="flex items-center gap-7">
            {links.slice(0, 2).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${isActive(href) ? "nav-link--active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Center: Brand/Logo */}
          <Link
            href="/"
            className="font-bold text-lg tracking-wide text-center"
            aria-label="Keshvi Crafts Home"
          >
            Keshvi Crafts
          </Link>

          {/* Right: Wishlist + Cart */}
          <div className="flex items-center gap-7 justify-end">
            {links.slice(2).map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${isActive(href) ? "nav-link--active" : ""} ${href === "/cart" ? "relative inline-flex items-center" : ""}`}
              >
                {label}
                {href === "/cart" && <CartBadge />}
              </Link>
            ))}
          </div>
        </nav>

        {/* Mobile Brand (centered) */}
        <Link
          href="/"
          className="md:hidden font-bold text-base tracking-wide mx-auto"
          aria-label="Keshvi Crafts Home"
        >
          Keshvi Crafts
        </Link>

        {/* Mobile toggle */}
        <button
          className="ml-auto md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-neutral-300/70 bg-white hover:bg-neutral-50"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden border-t border-neutral-200/60 bg-white/90 backdrop-blur">
          <div className="container py-3 flex flex-col gap-3">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link ${isActive(href) ? "nav-link--active" : ""} ${href === "/cart" ? "inline-flex items-center" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span className="text-base">{label}</span>
                {href === "/cart" && <CartBadge />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
