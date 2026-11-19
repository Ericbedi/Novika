"use client";

import React, { useState } from "react";
import { ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/ProductImage";

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

  // Filtrer les images valides non vides
  const validImages = images.filter((img) => typeof img === "string" && img.trim() !== "");
  const galleryImages = validImages.length > 0 ? validImages : [""];

  const currentImage = galleryImages[selectedIndex] || "";

  return (
    <div className="space-y-3 w-full">
      {/* Image Principale avec bouton Zoom */}
      <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-black/[0.03] border border-black/[0.08] shadow-xs group">
        <div
          className={cn(
            "w-full h-full cursor-zoom-in transition-transform duration-300",
            isZoomed && "scale-150 cursor-zoom-out"
          )}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <ProductImage
            src={currentImage}
            alt={`${productTitle} - Image principale`}
            fill
            priority
            fallbackLabel={productTitle}
            className="w-full h-full"
          />
        </div>

        {/* Bouton indicateur zoom */}
        <button
          type="button"
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition-colors cursor-pointer z-10"
          title={isZoomed ? "Réduire" : "Agrandir"}
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Flèches de navigation mobile / desktop si > 1 image */}
        {galleryImages.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-10">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) =>
                  prev === 0 ? galleryImages.length - 1 : prev - 1
                );
              }}
              className="p-2 rounded-full bg-white/90 shadow-md text-black hover:bg-white pointer-events-auto transition-transform active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex((prev) => (prev + 1) % galleryImages.length);
              }}
              className="p-2 rounded-full bg-white/90 shadow-md text-black hover:bg-white pointer-events-auto transition-transform active:scale-95 cursor-pointer"
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
                "relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer",
                selectedIndex === idx
                  ? "border-[#111111] shadow-xs"
                  : "border-black/[0.08] opacity-70 hover:opacity-100"
              )}
            >
              <ProductImage
                src={img}
                alt={`${productTitle} - Miniature ${idx + 1}`}
                fill
                fallbackLabel={`Vue ${idx + 1}`}
                className="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
