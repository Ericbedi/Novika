"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { SlideshowSettings } from "@/lib/theme-engine/schemas";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/utils";

interface SlideshowSectionProps {
  settings: SlideshowSettings;
  palette: ThemeColorPalette;
  buttonRadius?: BorderRadiusOption;
}

export function SlideshowSection({
  settings,
  palette,
  buttonRadius = "md",
}: SlideshowSectionProps) {
  const slides = settings.slides || [];
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, (settings.autoplaySpeed || 5) * 1000);
    return () => clearInterval(interval);
  }, [slides.length, settings.autoplaySpeed]);

  if (slides.length === 0) return null;

  const slide = slides[currentSlide] || slides[0];

  const btnRadiusClass =
    buttonRadius === "none"
      ? "rounded-none"
      : buttonRadius === "sm"
      ? "rounded-lg"
      : buttonRadius === "lg"
      ? "rounded-2xl"
      : buttonRadius === "full"
      ? "rounded-full"
      : "rounded-xl";

  return (
    <div className="relative w-full overflow-hidden rounded-3xl min-h-[360px] sm:min-h-[460px] flex items-center justify-center shadow-xs">
      {/* Image de fond */}
      <div className="absolute inset-0 z-0">
        <ProductImage
          src={slide.desktopImage}
          alt={slide.headline || "Bannière"}
          fill
          priority
          fallbackLabel={slide.headline}
          className="w-full h-full object-cover"
        />
        {/* Calque sombre réglable (0 à 90%) */}
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: (slide.overlayOpacity ?? 30) / 100 }}
        />
      </div>

      {/* Contenu textuel */}
      <div className="relative z-10 max-w-2xl px-6 py-12 text-center text-white space-y-4">
        {slide.headline && (
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {slide.headline}
          </h2>
        )}
        {slide.subheadline && (
          <p className="text-sm sm:text-base font-medium opacity-90 max-w-xl mx-auto leading-relaxed">
            {slide.subheadline}
          </p>
        )}

        {(slide.button1Label || slide.button2Label) && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {slide.button1Label && (
              <Link
                href={slide.button1Url || "#"}
                className={cn(
                  "px-6 py-3 text-xs sm:text-sm font-black transition-transform active:scale-95 shadow-md",
                  btnRadiusClass
                )}
                style={{
                  backgroundColor: palette.button,
                  color: palette.buttonText,
                }}
              >
                {slide.button1Label}
              </Link>
            )}
            {slide.button2Label && (
              <Link
                href={slide.button2Url || "#"}
                className={cn(
                  "px-6 py-3 text-xs sm:text-sm font-black bg-white/20 text-white backdrop-blur-xs hover:bg-white/30 transition-transform active:scale-95 border border-white/30",
                  btnRadiusClass
                )}
              >
                {slide.button2Label}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Flèches de navigation si > 1 diapositive */}
      {slides.length > 1 && settings.showArrows !== false && (
        <div className="absolute inset-y-0 inset-x-3 flex items-center justify-between pointer-events-none z-20">
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))}
            className="p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 pointer-events-auto backdrop-blur-xs transition-transform active:scale-95 cursor-pointer"
            aria-label="Diapositive précédente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
            className="p-2.5 rounded-full bg-black/40 text-white hover:bg-black/60 pointer-events-auto backdrop-blur-xs transition-transform active:scale-95 cursor-pointer"
            aria-label="Diapositive suivante"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Puces de pagination */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlide(idx)}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                currentSlide === idx ? "w-6 bg-white" : "w-2 bg-white/50"
              )}
              aria-label={`Aller à la diapositive ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
