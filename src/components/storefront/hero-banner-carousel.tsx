"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowRight,
} from "lucide-react";
import { BannerSlide } from "@/server/data/banner-types";
import { isSafeBannerDestinationUrl, computeOverlayContrast } from "@/lib/banner-security";

interface HeroBannerCarouselProps {
  slides: BannerSlide[];
  primaryColor?: string; // Jeton hexadécimal de thème (ex: #C2410C)
}

export function HeroBannerCarousel({
  slides,
  primaryColor = "#C2410C",
}: HeroBannerCarouselProps) {
  // Filtrer uniquement les diapositives actives (les brouillons ne sont jamais publics)
  const activeSlides = slides
    .filter((s) => s.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, 5); // Jusqu'à 5 diapositives

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isPrefersReducedMotion, setIsPrefersReducedMotion] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Détection du mode prefers-reduced-motion de l'utilisateur
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setIsPrefersReducedMotion(mediaQuery.matches);
      if (mediaQuery.matches) {
        setIsPlaying(false);
      }

      const handler = (e: MediaQueryListEvent) => {
        setIsPrefersReducedMotion(e.matches);
        if (e.matches) setIsPlaying(false);
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, []);

  const currentSlide = activeSlides[currentIndex];

  // Gestion du défilement automatique (minimum 5 secondes)
  useEffect(() => {
    if (!isPlaying || isPrefersReducedMotion || activeSlides.length <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const duration = Math.max((currentSlide?.durationSeconds || 5) * 1000, 5000);

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
    }, duration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPlaying, isPrefersReducedMotion, activeSlides.length, currentSlide]);

  if (activeSlides.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrev();
    } else if (e.key === "ArrowRight") {
      handleNext();
    }
  };

  const overlay = computeOverlayContrast(currentSlide.overlayOpacity);
  const isSafeUrl = isSafeBannerDestinationUrl(currentSlide.destinationUrl);
  const targetUrl = isSafeUrl && currentSlide.destinationUrl ? currentSlide.destinationUrl : null;

  return (
    <section
      role="region"
      aria-roledescription="carrousel"
      aria-label="Bannières promotionnelles vedettes"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="relative w-full overflow-hidden bg-[#111111] focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
      style={{ aspectRatio: "16 / 7", minHeight: "340px", maxHeight: "560px" }}
    >
      {/* Images du carrousel avec dimension explicite (zéro CLS) */}
      {activeSlides.map((slide, idx) => {
        const isCurrent = idx === currentIndex;
        const isPriority = idx === 0;

        return (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="diapositive"
            aria-label={`${idx + 1} sur ${activeSlides.length} : ${slide.title || slide.altText}`}
            aria-hidden={!isCurrent}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isCurrent ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
            }`}
          >
            {/* Image de fond avec recadrage et point focal */}
            <picture>
              {slide.mobileImageUrl && (
                <source
                  media="(max-width: 640px)"
                  srcSet={slide.mobileImageUrl}
                  width={750}
                  height={600}
                />
              )}
              <img
                src={slide.desktopImageUrl}
                alt={slide.altText}
                loading={isPriority ? "eager" : "lazy"}
                // @ts-ignore
                fetchpriority={isPriority ? "high" : "auto"}
                width={1920}
                height={840}
                className="w-full h-full object-cover select-none"
                style={{
                  objectPosition: `${slide.focalPointX}% ${slide.focalPointY}%`,
                }}
              />
            </picture>

            {/* Voile de lisibilité sombre calculé pour le contraste WCAG */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: overlay.overlayBackground }}
            />

            {/* Contenu superposé textuel */}
            {(slide.title || slide.subtitle || slide.buttonText) && (
              <div
                className={`absolute inset-0 p-6 sm:p-12 md:p-16 flex flex-col max-w-4xl ${
                  slide.textPosition === "middle_center"
                    ? "items-center justify-center text-center mx-auto"
                    : slide.textPosition === "middle_right"
                    ? "items-end justify-center text-right ml-auto"
                    : slide.textPosition === "bottom_left"
                    ? "items-start justify-end text-left"
                    : slide.textPosition === "bottom_center"
                    ? "items-center justify-end text-center mx-auto"
                    : "items-start justify-center text-left"
                }`}
              >
                {slide.title && (
                  <h2
                    className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-md text-white"
                  >
                    {slide.title}
                  </h2>
                )}

                {slide.subtitle && (
                  <p className="mt-2.5 sm:mt-4 text-xs sm:text-base md:text-lg text-white/90 max-w-2xl font-medium leading-relaxed drop-shadow-sm">
                    {slide.subtitle}
                  </p>
                )}

                {slide.buttonText && targetUrl && (
                  <div className="mt-4 sm:mt-6">
                    {targetUrl.startsWith("/") ? (
                      <Link
                        href={targetUrl}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-white transition-transform hover:scale-105 shadow-lg active:scale-95"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black text-white transition-transform hover:scale-105 shadow-lg active:scale-95"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span>{slide.buttonText}</span>
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Contrôles de navigation (précédent, suivant, pause) */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 text-white">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Diapositive précédente"
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Mettre en pause le défilement" : "Reprendre le défilement"}
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Diapositive suivante"
            className="p-1.5 rounded-xl hover:bg-white/20 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Indicateurs de progression (pastilles) */}
          <div className="flex items-center gap-1.5 px-2">
            {activeSlides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Aller à la diapositive ${idx + 1}`}
                aria-current={idx === currentIndex ? "true" : "false"}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
