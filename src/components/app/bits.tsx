"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

import { CountryFlag } from "@/components/ui/country-flag";

// Mini SVG pour chaque drapeau d'Afrique (Prompt 05-P2 : Tous les 54 pays, aucun emoji ni globe)
export function CountryFlagSvg({
  code,
  className,
  width = 24,
  height = 16,
}: {
  code: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}) {
  return <CountryFlag code={code} className={className} width={width} height={height} />;
}

export const COUNTRY_NAMES: Record<string, { name: string; code: string }> = {
  TG: { name: "Togo", code: "TG" },
  CI: { name: "Côte d'Ivoire", code: "CI" },
  SN: { name: "Sénégal", code: "SN" },
  BJ: { name: "Bénin", code: "BJ" },
};

export function CountryChip({
  code,
  showName = true,
  className,
}: {
  code: string;
  showName?: boolean;
  className?: string;
}) {
  const info = COUNTRY_NAMES[code] || { name: code, code };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-2 py-0.5 text-xs font-semibold text-[#111111] shadow-2xs",
        className
      )}
    >
      <CountryFlagSvg code={code} />
      <span>{showName ? info.name : code}</span>
    </span>
  );
}

export function InitialsAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();

  const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-sm",
  };

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#1F3A26] font-bold text-[#FAF8F5] ring-2 ring-white shadow-2xs",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

export function ProductThumb({
  src,
  alt = "",
  size = 40,
  className,
}: {
  src?: string;
  alt?: string;
  size?: number;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/[0.08] bg-[#FAF8F5] text-[#888880]",
        className
      )}
    >
      {src && !imgError ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <Package className="h-5 w-5 text-[#888880]" />
      )}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-[0_2px_12px_rgba(17,17,17,0.03)]",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
          <div>
            {typeof title === "string" ? (
              <h3 className="text-base font-semibold text-[#111111]">
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-[#666660]">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
