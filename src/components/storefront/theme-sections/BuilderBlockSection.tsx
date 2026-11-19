"use client";

import React from "react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { BuilderBlockSettings } from "@/lib/theme-engine/schemas";
import { ProductImage } from "@/components/ui/ProductImage";
import { Check, Star, ShieldCheck, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BuilderBlockSectionProps {
  settings: BuilderBlockSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
}

export function BuilderBlockSection({
  settings,
  palette,
  cardRadius = "md",
}: BuilderBlockSectionProps) {
  const blocks = settings.blocks || [];
  if (blocks.length === 0) return null;

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-3xl"
      : "rounded-2xl";

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {settings.title && (
        <h2 className="text-xl sm:text-3xl font-black text-center tracking-tight leading-tight">
          {settings.title}
        </h2>
      )}

      <div className="space-y-6">
        {blocks.map((block, idx) => {
          if (block.type === "text") {
            return (
              <div
                key={block.id || idx}
                className={cn("p-6 border shadow-2xs space-y-2", radiusClass)}
                style={{
                  backgroundColor: palette.cardBackground || palette.background,
                  borderColor: palette.borderColor || "transparent",
                }}
              >
                {block.title && <h3 className="text-base font-black">{block.title}</h3>}
                {block.content && (
                  <p className="text-xs sm:text-sm font-medium opacity-80 leading-relaxed whitespace-pre-line">
                    {block.content}
                  </p>
                )}
              </div>
            );
          }

          if (block.type === "image") {
            return (
              <div
                key={block.id || idx}
                className={cn("relative aspect-video w-full overflow-hidden border shadow-2xs", radiusClass)}
                style={{ borderColor: palette.borderColor || "transparent" }}
              >
                <ProductImage
                  src={block.imageUrl}
                  alt={block.title || "Illustration"}
                  fill
                  fallbackLabel={block.title}
                  className="w-full h-full object-cover"
                />
              </div>
            );
          }

          if (block.type === "icon_text") {
            return (
              <div
                key={block.id || idx}
                className={cn("p-5 border shadow-2xs flex items-start gap-4", radiusClass)}
                style={{
                  backgroundColor: palette.cardBackground || palette.background,
                  borderColor: palette.borderColor || "transparent",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                  style={{ backgroundColor: palette.button, color: palette.buttonText }}
                >
                  <Check className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  {block.title && <h4 className="text-sm font-black">{block.title}</h4>}
                  {block.content && (
                    <p className="text-xs font-medium opacity-80 leading-relaxed">
                      {block.content}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
