"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { ImageWithTextSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface ImageWithTextSectionProps {
  settings: ImageWithTextSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
  buttonRadius?: BorderRadiusOption;
}

export function ImageWithTextSection({
  settings,
  palette,
  cardRadius = "md",
  buttonRadius = "md",
}: ImageWithTextSectionProps) {
  const {
    imageUrl,
    imageAlt = "",
    imagePosition = "left",
    imageWidth = "50",
    title,
    badge,
    bodyText,
    buttonText,
    buttonLink,
  } = settings;

  // Calcul largeur image / texte
  const imageColClass =
    imageWidth === "33"
      ? "md:w-1/3"
      : imageWidth === "66"
      ? "md:w-2/3"
      : "md:w-1/2";

  const textColClass =
    imageWidth === "33"
      ? "md:w-2/3"
      : imageWidth === "66"
      ? "md:w-1/3"
      : "md:w-1/2";

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-3xl"
      : cardRadius === "full"
      ? "rounded-[36px]"
      : "rounded-2xl";

  const btnRadiusClass =
    buttonRadius === "none"
      ? "rounded-none"
      : buttonRadius === "sm"
      ? "rounded-lg"
      : buttonRadius === "lg"
      ? "rounded-2xl"
      : buttonRadius === "full"
      ? "rounded-full"
      : "rounded-xl";

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row items-center gap-8 md:gap-12 p-6 sm:p-10 border shadow-xs transition-colors",
        imagePosition === "right" ? "md:flex-row-reverse" : "",
        radiusClass
      )}
      style={{
        backgroundColor: palette.cardBackground || palette.background,
        color: palette.text,
        borderColor: palette.borderColor || "transparent",
      }}
    >
      {/* Colonne Image */}
      {imageUrl && (
        <div className={cn("w-full overflow-hidden shrink-0", imageColClass, radiusClass)}>
          <img
            src={imageUrl}
            alt={imageAlt || title || "Image descriptive"}
            className="w-full h-auto max-h-[460px] object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      )}

      {/* Colonne Texte */}
      <div className={cn("w-full flex flex-col justify-center space-y-4", textColClass)}>
        {badge && (
          <span
            className="inline-flex self-start px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
            style={{
              backgroundColor: `${palette.accent}20`,
              color: palette.accent,
            }}
          >
            {badge}
          </span>
        )}

        {title && (
          <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
            {title}
          </h2>
        )}

        {bodyText && (
          <div className="text-xs sm:text-sm font-medium leading-relaxed opacity-85 whitespace-pre-line">
            {bodyText}
          </div>
        )}

        {buttonText && (
          <div className="pt-2">
            <Link
              href={buttonLink || "#"}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-black transition-all shadow-md hover:scale-[1.02]",
                btnRadiusClass
              )}
              style={{
                backgroundColor: palette.button,
                color: palette.buttonText,
              }}
            >
              <span>{buttonText}</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
