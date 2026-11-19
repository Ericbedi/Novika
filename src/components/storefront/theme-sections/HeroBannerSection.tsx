"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { HeroBannerSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface HeroBannerSectionProps {
  settings: HeroBannerSettings;
  palette: ThemeColorPalette;
  buttonRadius?: BorderRadiusOption;
}

export function HeroBannerSection({
  settings,
  palette,
  buttonRadius = "md",
}: HeroBannerSectionProps) {
  const {
    desktopImage,
    mobileImage,
    overlayOpacity = 30,
    height = "medium",
    textAlignment = "center",
    textVerticalPosition = "center",
    badgeText,
    headline,
    subheadline,
    button1Text,
    button1Link,
    button2Text,
    button2Link,
  } = settings;

  // Calcul de la hauteur responsive
  const heightClass =
    height === "small"
      ? "min-h-[340px] sm:min-h-[420px]"
      : height === "large"
      ? "min-h-[520px] sm:min-h-[640px]"
      : height === "full"
      ? "min-h-[85vh]"
      : "min-h-[420px] sm:min-h-[520px]";

  // Alignement horizontal
  const alignClass =
    textAlignment === "left"
      ? "text-left items-start"
      : textAlignment === "right"
      ? "text-right items-end"
      : "text-center items-center";

  // Position verticale
  const verticalClass =
    textVerticalPosition === "top"
      ? "justify-start pt-12 sm:pt-16"
      : textVerticalPosition === "bottom"
      ? "justify-end pb-12 sm:pb-16"
      : "justify-center";

  // Arrondi des boutons
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

  const hasImage = Boolean(desktopImage || mobileImage);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden flex flex-col rounded-3xl shadow-xs transition-all",
        heightClass,
        verticalClass
      )}
      style={{
        backgroundColor: palette.background,
        color: palette.text,
      }}
    >
      {/* Image de fond desktop & mobile */}
      {hasImage && (
        <div className="absolute inset-0 z-0">
          {desktopImage && (
            <img
              src={desktopImage}
              alt={headline || "Bannière d'accueil"}
              className={cn(
                "w-full h-full object-cover",
                mobileImage ? "hidden sm:block" : "block"
              )}
            />
          )}
          {mobileImage && (
            <img
              src={mobileImage}
              alt={headline || "Bannière d'accueil"}
              className="w-full h-full object-cover block sm:hidden"
            />
          )}
          {/* Calque d'assombrissement réglable (0 à 90%) */}
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity / 100 }}
          />
        </div>
      )}

      {/* Contenu textuel */}
      <div
        className={cn(
          "relative z-10 max-w-4xl px-6 sm:px-12 py-8 flex flex-col space-y-4 mx-auto",
          alignClass,
          hasImage ? "text-white" : ""
        )}
      >
        {badgeText && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase shadow-xs"
            style={{
              backgroundColor: hasImage ? "rgba(255,255,255,0.2)" : palette.accent,
              color: hasImage ? "#FFFFFF" : "#FFFFFF",
            }}
          >
            {badgeText}
          </span>
        )}

        {headline && (
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            {headline}
          </h1>
        )}

        {subheadline && (
          <p
            className={cn(
              "text-xs sm:text-base font-medium max-w-2xl leading-relaxed",
              hasImage ? "text-white/90" : "opacity-80"
            )}
          >
            {subheadline}
          </p>
        )}

        {/* Boutons d'action CTA (jusqu'à 2 boutons) */}
        {(button1Text || button2Text) && (
          <div className="pt-3 flex flex-wrap items-center gap-3 justify-center sm:justify-start">
            {button1Text && (
              <Link
                href={button1Link || "#catalog"}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs sm:text-sm font-black transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]",
                  btnRadiusClass
                )}
                style={{
                  backgroundColor: palette.button,
                  color: palette.buttonText,
                }}
              >
                <span>{button1Text}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}

            {button2Text && (
              <Link
                href={button2Link || "#details"}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-2 transition-all hover:bg-white/10",
                  btnRadiusClass
                )}
                style={{
                  borderColor: hasImage ? "#FFFFFF" : palette.text,
                  color: hasImage ? "#FFFFFF" : palette.text,
                }}
              >
                <span>{button2Text}</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
