"use client";

import React from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { cn } from "@/lib/utils";

interface CountryFlagProps {
  code: string;
  name?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Composant de drapeau SVG local (Prompt 05-P #1).
 * Élimine le bogue d'affichage Windows où les drapeaux emoji sont remplacés par des globes 🌐.
 * Utilise country-flag-icons/react/3x2 en local sans requête réseau externe.
 * Fallback : pastille neutre avec code ISO, JAMAIS DE GLOBE.
 */
export function CountryFlag({
  code,
  name,
  className,
  width = 24,
  height = 16,
}: CountryFlagProps) {
  const upper = code ? code.trim().toUpperCase() : "";
  const FlagComponent = (Flags as Record<string, React.ComponentType<{ title?: string; className?: string }>>)[upper];

  if (!FlagComponent) {
    // Pastille neutre avec le code ISO - Strictement AUCUN globe
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center font-mono font-bold text-[10px] leading-none px-1 rounded-[2px] bg-muted text-muted-foreground border border-border/80 shrink-0 select-none",
          className
        )}
        style={{ width, height }}
        title={name || upper || "Inconnu"}
        aria-label={name || upper || "Inconnu"}
      >
        {upper.slice(0, 2) || "??"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-black/15 items-center justify-center bg-muted/40",
        className
      )}
      style={{ width, height }}
      title={name || upper}
      aria-label={name || upper}
    >
      <FlagComponent title={name || upper} className="w-full h-full object-cover" />
    </span>
  );
}
