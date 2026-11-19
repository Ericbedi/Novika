"use client";

import React from "react";
import Link from "next/link";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { ImageCollageSettings } from "@/lib/theme-engine/schemas";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/utils";

interface ImageCollageSectionProps {
  settings: ImageCollageSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
}

export function ImageCollageSection({
  settings,
  palette,
  cardRadius = "md",
}: ImageCollageSectionProps) {
  const images = settings.images || [];
  if (images.length === 0) return null;

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-3xl"
      : cardRadius === "full"
      ? "rounded-3xl"
      : "rounded-2xl";

  return (
    <div className="space-y-6">
      {settings.title && (
        <h2 className="text-xl sm:text-3xl font-black text-center tracking-tight">
          {settings.title}
        </h2>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {images.map((item, idx) => {
          const content = (
            <div
              key={item.id || idx}
              className={cn(
                "relative aspect-square overflow-hidden border shadow-2xs group cursor-pointer",
                radiusClass,
                idx === 0 && "col-span-2 row-span-2 aspect-square md:aspect-auto"
              )}
              style={{
                borderColor: palette.borderColor || "transparent",
              }}
            >
              <ProductImage
                src={item.imageUrl}
                alt={item.caption || `Image ${idx + 1}`}
                fill
                fallbackLabel={item.caption}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white text-xs font-bold">
                  {item.caption}
                </div>
              )}
            </div>
          );

          if (item.linkUrl) {
            return (
              <Link key={item.id || idx} href={item.linkUrl}>
                {content}
              </Link>
            );
          }
          return content;
        })}
      </div>
    </div>
  );
}
