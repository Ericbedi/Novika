"use client";

import React from "react";
import { Play } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { VideoSettings } from "@/lib/theme-engine/schemas";
import { cn } from "@/lib/utils";

interface VideoSectionProps {
  settings: VideoSettings;
  palette: ThemeColorPalette;
  cardRadius?: BorderRadiusOption;
}

export function VideoSection({
  settings,
  palette,
  cardRadius = "md",
}: VideoSectionProps) {
  const { title, subtitle, videoUrl, aspectRatio = "16:9" } = settings;

  if (!videoUrl?.trim()) return null;

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

  const aspectClass =
    aspectRatio === "9:16"
      ? "aspect-[9/16] max-w-sm mx-auto"
      : aspectRatio === "4:3"
      ? "aspect-[4/3] max-w-3xl mx-auto"
      : "aspect-video max-w-4xl mx-auto";

  // Extraction d'ID YouTube si URL YouTube
  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch")) {
      const v = new URL(url).searchParams.get("v");
      return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (url.includes("youtu.be/")) {
      const v = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube-nocookie.com/embed/${v}`;
    }
    if (url.includes("vimeo.com/")) {
      const v = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${v}`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isDirectVideo = videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm");

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4">
      {(title || subtitle) && (
        <div className="text-center space-y-2 max-w-2xl mx-auto">
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

      <div
        className={cn(
          "w-full overflow-hidden border shadow-md relative bg-black",
          aspectClass,
          radiusClass
        )}
      >
        {isDirectVideo ? (
          <video
            src={videoUrl}
            controls
            preload="metadata"
            className="w-full h-full object-contain"
          />
        ) : (
          <iframe
            src={embedUrl}
            title={title || "Vidéo de présentation"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
}
