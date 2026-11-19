"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ThemeColorPalette } from "@/lib/theme-engine/types";
import { AnnouncementBarSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface AnnouncementBarSectionProps {
  settings: AnnouncementBarSettings;
  palette: ThemeColorPalette;
  isEditMode?: boolean;
}

export function AnnouncementBarSection({
  settings,
  palette,
}: AnnouncementBarSectionProps) {
  const { messages = [], infiniteScroll, speed, enabled } = settings;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Défilement automatique entre messages si non infini et > 1 message
  useEffect(() => {
    if (messages.length <= 1 || infiniteScroll) return;
    const intervalTime = speed === "fast" ? 3000 : speed === "slow" ? 7000 : 4500;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [messages.length, infiniteScroll, speed]);

  if (!enabled || messages.length === 0) return null;

  const validMessages = messages.filter((m) => m && m.text && m.text.trim());
  if (validMessages.length === 0) return null;

  return (
    <div
      className="w-full text-xs font-bold py-2.5 px-4 transition-colors overflow-hidden border-b z-40 relative"
      style={{
        backgroundColor: palette.background,
        color: palette.text,
        borderColor: palette.borderColor || "transparent",
      }}
    >
      {infiniteScroll ? (
        <div className="flex gap-8 whitespace-nowrap animate-marquee">
          {validMessages.concat(validMessages).map((msg, i) => (
            <span key={i} className="inline-flex items-center gap-4">
              {msg.linkUrl ? (
                <Link href={msg.linkUrl} className="hover:underline">
                  {msg.text}
                </Link>
              ) : (
                <span>{msg.text}</span>
              )}
              <span className="opacity-40">·</span>
            </span>
          ))}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto text-center flex items-center justify-center min-h-[20px]">
          {validMessages[currentIndex]?.linkUrl ? (
            <Link
              href={validMessages[currentIndex].linkUrl}
              className="hover:underline truncate max-w-xl transition-all"
            >
              {validMessages[currentIndex].text}
            </Link>
          ) : (
            <span className="truncate max-w-xl transition-all">
              {validMessages[currentIndex]?.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
