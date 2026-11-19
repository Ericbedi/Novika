"use client";

import React from "react";
import { MessageSquareQuote, Star } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { TestimonialsSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  settings: TestimonialsSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
}

export function TestimonialsSection({
  settings,
  palette,
  cardRadius = "md",
}: TestimonialsSectionProps) {
  const { title = "Témoignages", subtitle, items = [] } = settings;

  const validItems = items.filter((i) => i && (i.quote?.trim() || i.authorName?.trim()));
  if (validItems.length === 0) return null;

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-3xl"
      : cardRadius === "full"
      ? "rounded-[32px]"
      : "rounded-2xl";

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 max-w-2xl mx-auto px-4">
        {title && (
          <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm font-medium opacity-80 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {validItems.map((item) => (
          <div
            key={item.id}
            className={cn("p-5 border shadow-2xs flex flex-col justify-between space-y-4", radiusClass)}
            style={{
              backgroundColor: palette.cardBackground || palette.background,
              color: palette.text,
              borderColor: palette.borderColor || "transparent",
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        i < item.rating ? "fill-amber-400 text-amber-500" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>

                {/* RÈGLE STRICTE PROMPT 12 : Toujours étiqueté « Témoignage », JAMAIS « Achat vérifié » */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/[0.04] text-[10px] font-black uppercase tracking-wider opacity-75">
                  <MessageSquareQuote className="w-2.5 h-2.5" />
                  <span>Témoignage</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium leading-relaxed opacity-90 italic">
                « {item.quote} »
              </p>
            </div>

            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[11px]">
              <span className="font-black">{item.authorName}</span>
              {item.authorRoleOrCity && (
                <span className="opacity-60">{item.authorRoleOrCity}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
