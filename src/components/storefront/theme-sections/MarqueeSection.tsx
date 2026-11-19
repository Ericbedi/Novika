"use client";

import React from "react";
import { Sparkles, Star, Zap, Check, ShieldCheck, Heart } from "lucide-react";
import { ThemeColorPalette } from "@/lib/theme-engine/types";
import { MarqueeSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Sparkles,
  Star,
  Zap,
  Check,
  ShieldCheck,
  Heart,
};

interface MarqueeSectionProps {
  settings: MarqueeSettings;
  palette: ThemeColorPalette;
}

export function MarqueeSection({ settings, palette }: MarqueeSectionProps) {
  const { textItems = [], speed = "normal", textSize = "md", separatorIcon = "Sparkles" } = settings;

  const validItems = textItems.filter((t) => t && t.trim());
  if (validItems.length === 0) return null;

  const IconComp = ICON_MAP[separatorIcon] || Sparkles;

  const sizeClass =
    textSize === "sm"
      ? "text-xs py-2"
      : textSize === "lg"
      ? "text-base sm:text-lg py-4 font-black"
      : textSize === "xl"
      ? "text-lg sm:text-2xl py-5 font-black tracking-tight"
      : "text-sm sm:text-base py-3 font-extrabold";

  const speedClass =
    speed === "fast"
      ? "duration-15000"
      : speed === "slow"
      ? "duration-35000"
      : "duration-25000";

  return (
    <div
      className={cn("w-full overflow-hidden whitespace-nowrap select-none border-y shadow-2xs", sizeClass)}
      style={{
        backgroundColor: palette.cardBackground || palette.background,
        color: palette.text,
        borderColor: palette.borderColor || "transparent",
      }}
    >
      <div className={cn("inline-flex items-center gap-8 animate-marquee", speedClass)}>
        {validItems.concat(validItems).concat(validItems).map((text, idx) => (
          <span key={idx} className="inline-flex items-center gap-4">
            <span className="uppercase tracking-wide">{text}</span>
            <IconComp
              className="h-4 w-4 shrink-0"
              style={{ color: palette.accent }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
