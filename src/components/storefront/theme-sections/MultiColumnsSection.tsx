"use client";

import React from "react";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  Clock,
  Award,
  Sparkles,
  Phone,
  CheckCircle2,
  ThumbsUp,
  Heart,
  Zap,
  ArrowRight,
} from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { MultiColumnsSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

// Registre d'icônes Lucide libres
const ICON_MAP: Record<string, React.ElementType> = {
  Truck,
  ShieldCheck,
  Clock,
  Award,
  Sparkles,
  Phone,
  CheckCircle2,
  ThumbsUp,
  Heart,
  Zap,
};

interface MultiColumnsSectionProps {
  settings: MultiColumnsSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
}

export function MultiColumnsSection({
  settings,
  palette,
  cardRadius = "md",
}: MultiColumnsSectionProps) {
  const { title, subtitle, columns = [], mobileSwipe = true } = settings;

  const validColumns = columns.filter((c) => c && (c.title?.trim() || c.text?.trim()));
  if (validColumns.length === 0) return null;

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

  // Grille desktop selon le nombre de colonnes (2, 3 ou 4)
  const gridDesktopClass =
    validColumns.length === 2
      ? "sm:grid-cols-2"
      : validColumns.length === 3
      ? "sm:grid-cols-3"
      : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className="space-y-8">
      {/* En-tête de section */}
      {(title || subtitle) && (
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
      )}

      {/* Conteneur de colonnes : balayage tactile horizontal sur mobile ou grille */}
      <div
        className={cn(
          "grid gap-4",
          gridDesktopClass,
          mobileSwipe
            ? "flex overflow-x-auto snap-x snap-mandatory pb-4 sm:pb-0 sm:grid sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
            : "grid-cols-1"
        )}
      >
        {validColumns.map((col) => {
          const IconComponent = ICON_MAP[col.iconName] || ShieldCheck;

          return (
            <div
              key={col.id}
              className={cn(
                "p-6 flex flex-col justify-between border shadow-2xs transition-all",
                mobileSwipe ? "min-w-[280px] max-w-[320px] shrink-0 snap-start sm:min-w-0 sm:max-w-none" : "w-full",
                radiusClass
              )}
              style={{
                backgroundColor: palette.cardBackground || palette.background,
                color: palette.text,
                borderColor: palette.borderColor || "transparent",
              }}
            >
              <div className="space-y-4">
                {col.imageUrl ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden mb-2">
                    <img src={col.imageUrl} alt={col.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs"
                    style={{
                      backgroundColor: `${palette.accent}20`,
                      color: palette.accent,
                    }}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                )}

                {col.title && (
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    {col.title}
                  </h3>
                )}

                {col.text && (
                  <p className="text-xs sm:text-sm font-medium opacity-80 leading-relaxed">
                    {col.text}
                  </p>
                )}
              </div>

              {col.linkUrl && (
                <div className="pt-4 mt-auto">
                  <Link
                    href={col.linkUrl}
                    className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline"
                    style={{ color: palette.button }}
                  >
                    <span>{col.linkLabel || "En savoir plus"}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
