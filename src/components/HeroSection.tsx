"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import "./HeroSection.css";

const AUTO_PLAY_MS = 4500;

const heroSlides = [
  {
    title: "Soft Switch",
    subtitle: "Discover comfortable and stylish clothing for every moment.",
    image: "/uploads/hero/corosal-1.png",
    primaryCta: { label: "Browse Clothing", href: "/collections/soft-fits" },
    secondaryCta: { label: "Explore Collection", href: "/collections" },
  },
  {
    title: "Forever Blooms",
    subtitle: "Elegant floral arrangements for every occasion.",
    image: "/uploads/hero/corosal-2.png",
    primaryCta: { label: "Browse Flowers", href: "/collections/forever-blooms" },
    secondaryCta: { label: "Send a Bouquet", href: "/collections" },
  },
  {
    title: "Cozy Corners",
    subtitle: "Transform your home with minimal and elegant decor.",
    image: "/uploads/hero/corosal-3.png",
    primaryCta: { label: "Browse Decor", href: "/collections/home-feelings" },
    secondaryCta: { label: "Shop Now", href: "/collections" },
  },
  {
    title: "Everyday Essentials",
    subtitle: "Curated products designed to elevate your daily life.",
    image: "/uploads/hero/corosal-4.png",
    primaryCta: { label: "Browse Essentials", href: "/collections/little-things" },
    secondaryCta: { label: "View Collection", href: "/collections" },
  },
] as const;

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % heroSlides.length);
    }, AUTO_PLAY_MS);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const goToPrevious = () => {
    setActiveIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % heroSlides.length);
  };

  return (
    <section className="hero-carousel" aria-label="Featured collections">
      <div
        className="hero-carousel__viewport"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <div
          className="hero-carousel__track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {heroSlides.map((slide, index) => (
            <article className="hero-slide" key={slide.title} aria-hidden={activeIndex !== index}>
              <div className="hero-slide__inner">
                <div className="hero-slide__media">
                  <div className="hero-slide__image-shell">
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      width={720}
                      height={720}
                      className="hero-slide__image"
                      priority={index === 0}
                    />
                  </div>
                </div>

                <div className="hero-slide__content">
                  <p className="hero-slide__eyebrow">Curated for thoughtful gifting</p>
                  <h1>{slide.title}</h1>
                  <p className="hero-slide__subtitle">{slide.subtitle}</p>

                  <div className="hero-slide__actions">
                    <Link href={slide.primaryCta.href} className="btn-luxe hero-slide__button">
                      {slide.primaryCta.label}
                    </Link>
                    <Link href={slide.secondaryCta.href} className="btn-secondary hero-slide__button hero-slide__button--secondary">
                      {slide.secondaryCta.label}
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
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
        {heroSlides.map((slide, index) => (
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
