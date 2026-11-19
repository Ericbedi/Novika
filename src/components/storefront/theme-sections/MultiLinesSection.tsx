"use client";

import React from "react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { MultiLinesSettings } from "@/lib/theme-engine/schemas";
import { ProductImage } from "@/components/ui/ProductImage";
import { cn } from "@/lib/utils";

interface MultiLinesSectionProps {
  settings: MultiLinesSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
}

export function MultiLinesSection({
  settings,
  palette,
  cardRadius = "md",
}: MultiLinesSectionProps) {
  const lines = settings.lines || [];
  if (lines.length === 0) return null;

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
    <div className="space-y-12">
      {settings.title && (
        <h2 className="text-xl sm:text-3xl font-black text-center tracking-tight">
          {settings.title}
        </h2>
      )}

      <div className="space-y-8 sm:space-y-12">
        {lines.map((line, idx) => {
          const isImageLeft = line.imagePosition === "left";

          return (
            <div
              key={line.id || idx}
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center p-6 sm:p-8 border shadow-2xs",
                radiusClass
              )}
              style={{
                backgroundColor: palette.cardBackground || palette.background,
                borderColor: palette.borderColor || "transparent",
              }}
            >
              <div
                className={cn(
                  "relative aspect-4/3 w-full overflow-hidden shadow-2xs",
                  radiusClass,
                  !isImageLeft && "md:order-2"
                )}
              >
                <ProductImage
                  src={line.imageUrl}
                  alt={line.title}
                  fill
                  fallbackLabel={line.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className={cn("space-y-3", !isImageLeft && "md:order-1")}>
                {line.title && (
                  <h3 className="text-lg sm:text-2xl font-black tracking-tight leading-snug">
                    {line.title}
                  </h3>
                )}
                {line.text && (
                  <p className="text-xs sm:text-sm font-medium opacity-80 leading-relaxed whitespace-pre-line">
                    {line.text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
