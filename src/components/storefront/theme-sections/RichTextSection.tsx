"use client";

import React from "react";
import { ThemeColorPalette } from "@/lib/theme-engine/types";
import { RichTextSettings } from "@/lib/theme-engine/schemas";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { cn } from "@/lib/utils";

interface RichTextSectionProps {
  settings: RichTextSettings;
  palette: ThemeColorPalette;
}

export function RichTextSection({ settings, palette }: RichTextSectionProps) {
  const { title, badge, content, alignment = "center" } = settings;

  if (!title?.trim() && !content?.trim()) return null;

  const sanitizedContent = sanitizeHtml(content || "");

  return (
    <div
      className={cn(
        "max-w-3xl mx-auto space-y-4 px-4",
        alignment === "center" ? "text-center" : "text-left"
      )}
      style={{ color: palette.text }}
    >
      {badge && (
        <span
          className="inline-flex px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-2xs"
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

      {sanitizedContent && (
        <div
          className="prose prose-sm max-w-none text-xs sm:text-sm font-medium leading-relaxed opacity-85 space-y-3"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      )}
    </div>
  );
}
