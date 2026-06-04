"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import "./HeroSection.css";

const DEFAULT_AUTO_PLAY_MS = 4500;

const defaultSlides = [
  {
    title: "Soft Switch",
    subtitle: "Discover comfortable and stylish clothing for every moment.",
    image_url: "/uploads/hero/corosal-1.png",
    primary_cta_label: "Browse Clothing",
    primary_cta_href: "/collections/apparels",
    secondary_cta_label: "Explore Collection",
    secondary_cta_href: "/collections",
  },
  {
    title: "Forever Blooms",
    subtitle: "Elegant floral arrangements for every occasion.",
    image_url: "/uploads/hero/corosal-2.png",
    primary_cta_label: "Browse Flowers",
    primary_cta_href: "/collections/flowers",
    secondary_cta_label: "Send a Bouquet",
    secondary_cta_href: "/collections",
  },
  {
    title: "Cozy Corners",
    subtitle: "Transform your home with minimal and elegant decor.",
    image_url: "/uploads/hero/corosal-3.png",
    primary_cta_label: "Browse Decor",
    primary_cta_href: "/collections/home-decor",
    secondary_cta_label: "Shop Now",
    secondary_cta_href: "/collections",
  },
  {
    title: "Everyday Essentials",
    subtitle: "Curated products designed to elevate your daily life.",
    image_url: "/uploads/hero/corosal-4.png",
    primary_cta_label: "Browse Keyrings",
    primary_cta_href: "/collections/keyrings",
    secondary_cta_label: "View Collection",
    secondary_cta_href: "/collections",
  },
];

export default function HeroSection({ slides, autoPlayMs }: { slides?: any[], autoPlayMs?: number }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const displaySlides = slides && slides.length > 0 ? slides : defaultSlides;
  const currentAutoPlayMs = autoPlayMs || DEFAULT_AUTO_PLAY_MS;

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % displaySlides.length);
    }, currentAutoPlayMs);

    return () => window.clearInterval(timer);
  }, [isPaused, currentAutoPlayMs, displaySlides.length]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + displaySlides.length) % displaySlides.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % displaySlides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = 0; // reset end on new touch
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <section className="hero-carousel" aria-label="Featured collections">
      <div
        className="hero-carousel__viewport"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="hero-carousel__track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {displaySlides.map((slide, index) => {
            const mediaUrl = slide.image_url || slide.image || "";
            const isVideo = mediaUrl.toLowerCase().endsWith('.mp4') || mediaUrl.toLowerCase().endsWith('.webm');
            
            return (
            <article className="hero-slide" key={slide.title} aria-hidden={activeIndex !== index}>
              <div className="hero-slide__inner">
                <div className="hero-slide__media">
                  <div className="hero-slide__image-shell">
                    {isVideo ? (
                      <video
                        src={mediaUrl}
                        className="hero-slide__image"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={mediaUrl}
                        alt={slide.title}
                        width={720}
                        height={720}
                        className="hero-slide__image"
                        priority={index === 0}
                        unoptimized
                      />
                    )}
                  </div>
                </div>

                <div className="hero-slide__content">
                  <h1 className="hero-title">{slide.title}</h1>
                  <p className="hero-slide__subtitle">{slide.subtitle}</p>

                  <div className="hero-slide__actions">
                    <Link href={slide.primary_cta_href} className="btn-luxe hero-slide__button">
                      {slide.primary_cta_label}
                    </Link>
                    <Link href={slide.secondary_cta_href} className="btn-secondary hero-slide__button hero-slide__button--secondary">
                      {slide.secondary_cta_label}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
          })}
        </div>
      </div>

      <button
        type="button"
        className="hero-carousel__arrow carousel-arrow hero-carousel__arrow--prev"
        onClick={goToPrevious}
        aria-label="Previous slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        className="hero-carousel__arrow carousel-arrow hero-carousel__arrow--next"
        onClick={goToNext}
        aria-label="Next slide"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div className="hero-carousel__dots" aria-label="Carousel navigation">
        {displaySlides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            className={`hero-carousel__dot ${activeIndex === index ? "is-active" : ""}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}: ${slide.title}`}
            aria-pressed={activeIndex === index}
          />
        ))}
      </div>
    </section>
  );
}
