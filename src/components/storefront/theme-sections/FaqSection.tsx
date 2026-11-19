"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { FaqSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface FaqSectionProps {
  settings: FaqSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
}

export function FaqSection({
  settings,
  palette,
  cardRadius = "md",
}: FaqSectionProps) {
  const { title = "Questions fréquentes", subtitle, items = [] } = settings;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const validItems = items.filter((i) => i && i.question?.trim() && i.answer?.trim());
  if (validItems.length === 0) return null;

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-2xl"
      : cardRadius === "full"
      ? "rounded-3xl"
      : "rounded-xl";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2 px-4">
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

      <div className="space-y-3">
        {validItems.map((item, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={item.id}
              className={cn("border transition-all overflow-hidden shadow-2xs", radiusClass)}
              style={{
                backgroundColor: palette.cardBackground || palette.background,
                color: palette.text,
                borderColor: palette.borderColor || "transparent",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-black text-xs sm:text-sm cursor-pointer hover:bg-black/[0.02] transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>{item.question}</span>
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 shrink-0 transition-transform duration-200",
                    isOpen ? "rotate-180" : ""
                  )}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-1 text-xs sm:text-sm font-medium opacity-85 leading-relaxed border-t border-black/[0.04]">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
