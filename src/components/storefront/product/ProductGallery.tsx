"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ZoomIn, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  productTitle: string;
  videoUrl?: string;
}

export function ProductGallery({
  images = [],
  productTitle,
  videoUrl,
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const galleryImages =
    images.length > 0 ? images : ["/images/placeholder-product.png"];

  return (
    <div className="space-y-3 w-full">
      {/* Image Principale avec bouton Zoom */}
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-black/[0.03] border border-black/[0.08] shadow-xs group">
        <img
          src={galleryImages[selectedIndex]}
          alt={`${productTitle} - Image ${selectedIndex + 1}`}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300 cursor-zoom-in",
            isZoomed ? "scale-150 cursor-zoom-out" : "hover:scale-105"
          )}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Bouton indicateur zoom */}
        <button
          type="button"
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/50 text-white hover:bg-black/70 backdrop-blur-xs transition-colors cursor-pointer"
          title={isZoomed ? "Réduire" : "Agrandir"}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Flèches de navigation mobile / desktop si > 1 image */}
        {galleryImages.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === 0 ? galleryImages.length - 1 : prev - 1
                )
              }
              className="p-2 rounded-full bg-white/90 shadow-md text-black hover:bg-white pointer-events-auto transition-transform active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setSelectedIndex((prev) => (prev + 1) % galleryImages.length)
              }
              className="p-2 rounded-full bg-white/90 shadow-md text-black hover:bg-white pointer-events-auto transition-transform active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Miniatures horizontales (Tactile 44px min, scroll doux sur mobile) */}
      {galleryImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {galleryImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSelectedIndex(idx);
                setIsZoomed(false);
              }}
              className={cn(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all p-0.5 min-w-[44px] min-h-[44px] cursor-pointer",
                selectedIndex === idx
                  ? "border-[#111111] shadow-xs scale-102"
                  : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={img}
                alt={`Miniature ${idx + 1}`}
                className="w-full h-full object-cover rounded-xl"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
