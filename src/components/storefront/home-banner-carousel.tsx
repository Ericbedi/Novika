"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeBanner } from "@/server/data/storefront-types";

/** Carrousel de bannières de la page d'accueil (jusqu'à 5 images, image mobile dédiée possible). */
export function HomeBannerCarousel({ banners }: { banners: HomeBanner[] }) {
  const slides = banners.slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;
  const go = (d: number) => setIndex((i) => (i + d + slides.length) % slides.length);

  return (
    <section
      className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6"
      aria-roledescription="carrousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-black/[0.04]">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((b, i) => {
            const img = (
              <picture>
                {b.mobileImageUrl && <source media="(max-width: 640px)" srcSet={b.mobileImageUrl} />}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.imageUrl}
                  alt={b.altText || ""}
                  loading={i === 0 ? "eager" : "lazy"}
                  className={`w-full object-cover ${b.mobileImageUrl ? "aspect-[4/5] sm:aspect-[16/6]" : "aspect-[16/9] sm:aspect-[16/6]"}`}
                />
              </picture>
            );
            return (
              <div key={b.id} className="w-full shrink-0" aria-hidden={i !== index}>
                {b.linkUrl ? (
                  b.linkUrl.startsWith("/") || b.linkUrl.startsWith("#") ? (
                    <Link href={b.linkUrl} tabIndex={i === index ? 0 : -1}>{img}</Link>
                  ) : (
                    <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" tabIndex={i === index ? 0 : -1}>{img}</a>
                  )
                ) : (
                  img
                )}
              </div>
            );
          })}
        </div>

        {slides.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/85 shadow hover:bg-white cursor-pointer" aria-label="Bannière précédente">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(1)} className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white/85 shadow hover:bg-white cursor-pointer" aria-label="Bannière suivante">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {slides.map((b, i) => (
                <button key={b.id} type="button" onClick={() => setIndex(i)} aria-label={`Bannière ${i + 1}`} className={`h-2 rounded-full transition-all cursor-pointer ${i === index ? "w-6 bg-white" : "w-2 bg-white/60"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
