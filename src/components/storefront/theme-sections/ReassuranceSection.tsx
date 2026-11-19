"use client";

import React from "react";
import {
  Truck,
  ShieldCheck,
  Clock,
  Phone,
  RotateCcw,
  Award,
  Lock,
  ThumbsUp,
  PackageCheck,
  BadgeCheck,
} from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { ReassuranceSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Truck,
  ShieldCheck,
  Clock,
  Phone,
  RotateCcw,
  Award,
  Lock,
  ThumbsUp,
  PackageCheck,
  BadgeCheck,
};

interface ReassuranceSectionProps {
  settings: ReassuranceSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
}

export function ReassuranceSection({
  settings,
  palette,
  cardRadius = "md",
}: ReassuranceSectionProps) {
  const { title, items = [] } = settings;

  const validItems = items.filter((i) => i && i.title?.trim());
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

  const gridClass =
    validItems.length <= 2
      ? "sm:grid-cols-2"
      : validItems.length === 3
      ? "sm:grid-cols-3"
      : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-center text-lg sm:text-2xl font-black tracking-tight">
          {title}
        </h2>
      )}

      <div className={cn("grid grid-cols-1 gap-3 sm:gap-4", gridClass)}>
        {validItems.map((item) => {
          const IconComp = ICON_MAP[item.icon] || ShieldCheck;

          return (
            <div
              key={item.id}
              className={cn(
                "p-4 sm:p-5 flex items-start gap-3.5 border shadow-2xs transition-all",
                radiusClass
              )}
              style={{
                backgroundColor: palette.cardBackground || palette.background,
                color: palette.text,
                borderColor: palette.borderColor || "transparent",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                style={{
                  backgroundColor: `${palette.accent}20`,
                  color: palette.accent,
                }}
              >
                <IconComp className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-black tracking-tight leading-snug">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="text-[11px] sm:text-xs font-medium opacity-75 leading-relaxed">
                    {item.description}
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
