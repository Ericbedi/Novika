"use client";

import React, { useState, useEffect, useRef } from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export interface StatCardsGridProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  id?: string;
}

/**
 * Conteneur de grille unifiée pour les 5 cartes de statistiques.
 * - display: grid; gap: 12px; container-type: inline-size;
 * - >= 960px : repeat(5, minmax(0, 1fr)) (5 sur une rangée)
 * - 600px - 959px : 3 colonnes (3 + 2 étirées)
 * - < 600px : 2 colonnes (2 + 2 + 1 pleine largeur)
 */
export function StatCardsGrid({
  children,
  className,
  containerClassName,
  id = "stat-cards-grid",
}: StatCardsGridProps) {
  return (
    <div className={cn("stat-cards-container", containerClassName)}>
      <div id={id} className={cn("stat-cards-grid", className)}>
        {children}
      </div>
    </div>
  );
}

export interface StatCardProps {
  label: string;
  value?: React.ReactNode;
  numericValue?: number;
  formattedValue?: string;
  compactValue?: string;
  currency?: string;
  unit?: string;
  hint?: string;
  delta?: {
    value: number;
    upIsGood?: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  sparkline?: number[];
  isLoading?: boolean;
  className?: string;
  id?: string;
}

/**
 * Formate un nombre en format compact selon les normes françaises :
 * - 1 234 -> « 1,2 k »
 * - 3 850 000 -> « 3,85 M »
 * - 2 480 000 -> « 2,48 M »
 */
export function formatCompactFr(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1_000_000) {
    const m = val / 1_000_000;
    const formatted = m.toLocaleString("fr-FR", {
      minimumFractionDigits: m % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 2,
    });
    return `${formatted}\u00A0M`;
  }
  if (abs >= 1_000) {
    const k = val / 1_000;
    const formatted = k.toLocaleString("fr-FR", {
      minimumFractionDigits: k % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 1,
    });
    return `${formatted}\u00A0k`;
  }
  return val.toLocaleString("fr-FR");
}

/**
 * Formate un nombre complet avec espace insécable pour les milliers :
 * - 3850000 -> « 3 850 000 »
 */
export function formatNumberFr(val: number): string {
  return val.toLocaleString("fr-FR").replace(/\s/g, "\u00A0");
}

/**
 * Composant Carte de Statistiques standardisé.
 * - Rayon 16 px, padding 14px haut/bas, 16px gauche/droite, min-h 128px
 * - En-tête : label 11px majuscules tracking 0.04em, icône en pastille 28px
 * - Valeur : clamp(18px, 1.7vw, 24px) semi-gras, unité/devise 12px neutre
 * - Pastille variation : hauteur 20px, texte 11-12px, signe typographique (− / +), flèche, accessible
 * - Texte hint : affiché si largeur carte >= 240px, sinon en info-bulle sur la pastille
 * - Format compact si largeur carte < 210px
 * - Mini-courbe : 24px de haut, fine bordure, même ligne de base dans toutes les cartes
 */
export function StatCard({
  label,
  value,
  numericValue,
  formattedValue: customFormattedValue,
  compactValue: customCompactValue,
  currency,
  unit,
  hint,
  delta,
  icon: Icon,
  iconBg = "bg-[#F3EFE6]",
  iconColor = "text-[#111111]",
  sparkline,
  isLoading = false,
  className,
  id,
}: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isNarrowCard, setIsNarrowCard] = useState(false); // < 210px
  const [isWideCard, setIsWideCard] = useState(false); // >= 240px

  // Observer de redimensionnement de carte pour bascule dynamique fluide
  useEffect(() => {
    if (!cardRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setIsNarrowCard(width < 210);
        setIsWideCard(width >= 240);
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className="stat-card-item rounded-2xl border border-black/[0.08] bg-white py-3.5 px-4 shadow-2xs min-h-[128px] h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-20 bg-[#E5DEC9]" />
          <Skeleton className="h-7 w-7 rounded-lg bg-[#E5DEC9]" />
        </div>
        <Skeleton className="mt-2 h-7 w-28 bg-[#E5DEC9]" />
        <Skeleton className="mt-2 h-5 w-20 rounded-full bg-[#E5DEC9]" />
        <div className="mt-auto pt-2 border-t border-black/[0.06]">
          <Skeleton className="h-6 w-full bg-[#E5DEC9]" />
        </div>
      </div>
    );
  }

  // Calcul et formatage des valeurs numériques
  let finalFormatted = customFormattedValue;
  let finalCompact = customCompactValue;

  if (numericValue !== undefined) {
    if (!finalFormatted) {
      finalFormatted = formatNumberFr(numericValue);
    }
    if (!finalCompact) {
      finalCompact = formatCompactFr(numericValue);
    }
  } else if (typeof value === "string") {
    if (!finalFormatted) finalFormatted = value;
    if (!finalCompact) finalCompact = value;
  }

  const fullDisplayString = [
    finalFormatted || value,
    currency,
    unit,
  ]
    .filter(Boolean)
    .join("\u00A0");

  const compactDisplayString = [
    finalCompact || finalFormatted || value,
    currency,
    unit,
  ]
    .filter(Boolean)
    .join("\u00A0");

  // Analyse et libellé de variation
  const isPositive = delta ? delta.value >= 0 : null;
  const isGood = delta ? (delta.upIsGood !== false ? isPositive : !isPositive) : null;
  const deltaNum = delta ? Math.abs(delta.value) : 0;
  const deltaFormatted = deltaNum.toLocaleString("fr-FR", {
    minimumFractionDigits: deltaNum % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
  const deltaSign = isPositive ? "+" : "−"; // Signe moins typographique \u2212
  const deltaText = `${deltaSign}${deltaFormatted}\u00A0%`;
  const accessibleDelta = isPositive
    ? `en hausse de ${deltaFormatted} %`
    : `en baisse de ${deltaFormatted} %`;

  return (
    <div
      ref={cardRef}
      id={id}
      data-card-narrow={isNarrowCard ? "true" : "false"}
      data-card-wide={isWideCard ? "true" : "false"}
      className={cn(
        "stat-card-item group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-black/[0.08] bg-white py-3.5 px-4 shadow-2xs min-h-[128px] h-full transition-all duration-200 hover:border-black/20 hover:shadow-xs select-none",
        className
      )}
    >
      {/* 1. En-tête : Étiquette de 11 px en majuscules + Icône dans pastille de 28 px */}
      <div className="flex items-center justify-between gap-2 relative z-10 min-w-0">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#666660] truncate"
          title={label}
        >
          {label}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-black/[0.06] shadow-2xs transition-transform duration-200 group-hover:scale-105",
              iconBg
            )}
            aria-hidden="true"
          >
            <Icon className={cn("h-3.5 w-3.5", iconColor)} />
          </div>
        )}
      </div>

      {/* 2. Valeur : font-size clamp(18px, 1.7vw, 24px) semi-gras, unité/devise 12px neutre */}
      <div
        className="stat-card-val-container mt-1.5 relative z-10 min-w-0"
        title={fullDisplayString}
        tabIndex={0}
        aria-label={`${label} : ${fullDisplayString}`}
      >
        <span className="sr-only">{fullDisplayString}</span>

        {/* Valeur complète (affichée si carte >= 210px) */}
        <span aria-hidden="true" className="stat-card-val-full whitespace-nowrap">
          <span className="text-[clamp(18px,1.7vw,24px)] font-semibold text-[#111111] leading-tight whitespace-nowrap">
            {finalFormatted || value}
          </span>
          {currency && (
            <span className="text-[12px] font-normal text-[#666660] ml-1 whitespace-nowrap">
              {currency}
            </span>
          )}
          {unit && (
            <span className="text-[12px] font-normal text-[#666660] ml-1 whitespace-nowrap">
              {unit}
            </span>
          )}
        </span>

        {/* Valeur compacte (affichée si carte < 210px) */}
        <span aria-hidden="true" className="stat-card-val-compact whitespace-nowrap">
          <span className="text-[clamp(18px,1.7vw,24px)] font-semibold text-[#111111] leading-tight whitespace-nowrap">
            {finalCompact || finalFormatted || value}
          </span>
          {currency && (
            <span className="text-[12px] font-normal text-[#666660] ml-1 whitespace-nowrap">
              {currency}
            </span>
          )}
          {unit && (
            <span className="text-[12px] font-normal text-[#666660] ml-1 whitespace-nowrap">
              {unit}
            </span>
          )}
        </span>

        {/* 3. Ligne de variation & texte explicatif */}
        <div className="mt-1.5 flex items-center gap-1.5 min-w-0">
          {delta && (
            <span
              tabIndex={0}
              role="status"
              title={hint ? `${hint} (${accessibleDelta})` : accessibleDelta}
              aria-label={hint ? `${hint} (${accessibleDelta})` : accessibleDelta}
              className={cn(
                "inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[11px] font-medium border shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black/20 cursor-help",
                isGood
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                  : "bg-rose-50 text-rose-700 border-rose-200/60"
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-emerald-700 shrink-0" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-3 w-3 text-rose-700 shrink-0" aria-hidden="true" />
              )}
              <span>{deltaText}</span>
              <span className="sr-only"> ({accessibleDelta})</span>
            </span>
          )}

          {/* Texte explicatif : affiché si carte >= 240px, sinon masqué car déjà dans l'info-bulle de la pastille */}
          {hint && (
            <span
              className="stat-card-hint-text text-[11px] text-[#888880] truncate font-normal"
              title={hint}
            >
              {hint}
            </span>
          )}
        </div>
      </div>

      {/* 4. Mini-courbe : 24 px de haut, séparée par un trait fin, alignée sur la même ligne de base */}
      <div className="mt-auto pt-2 border-t border-black/[0.06] relative z-10 shrink-0">
        {sparkline && sparkline.length > 1 ? (
          <svg
            className="h-6 w-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 100 24"
            aria-hidden="true"
          >
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                isGood
                  ? "text-emerald-700"
                  : isGood === false
                    ? "text-rose-600"
                    : "text-[#111111]"
              }
              points={sparkline
                .map((val, idx) => {
                  const min = Math.min(...sparkline);
                  const max = Math.max(...sparkline) || 1;
                  const x = (idx / (sparkline.length - 1)) * 100;
                  const range = max - min || 1;
                  const y = 22 - ((val - min) / range) * 18;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          </svg>
        ) : (
          <div className="h-6 w-full flex items-center justify-center text-[10px] text-[#888880]" aria-hidden="true">
            —
          </div>
        )}
      </div>
    </div>
  );
}
