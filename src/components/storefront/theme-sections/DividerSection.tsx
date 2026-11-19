"use client";

import React from "react";
import { ThemeColorPalette } from "@/lib/theme-engine/types";
import { DividerSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface DividerSectionProps {
  settings: DividerSettings;
  palette: ThemeColorPalette;
}

export function DividerSection({ settings, palette }: DividerSectionProps) {
  const { style = "solid", spacing = "medium" } = settings;

  const spacingClass =
    spacing === "small"
      ? "my-4"
      : spacing === "large"
      ? "my-16"
      : "my-8";

  if (style === "spacer") {
    return <div className={spacingClass} />;
  }

  if (style === "wave") {
    return (
      <div className={cn("w-full overflow-hidden flex items-center justify-center opacity-30", spacingClass)}>
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="w-full h-6"
          fill="none"
          stroke="currentColor"
          style={{ color: palette.borderColor || palette.accent }}
        >
          <path
            d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("max-w-6xl mx-auto px-4", spacingClass)}>
      <hr
        className={cn(
          "w-full border-t",
          style === "dashed" ? "border-dashed" : "border-solid"
        )}
        style={{ borderColor: palette.borderColor || "rgba(0,0,0,0.08)" }}
      />
    </div>
  );
}
