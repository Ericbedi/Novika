"use client";

import React from "react";
import { Star, Truck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductPriceBlockProps {
  currentPrice: number;
  compareAtPrice?: number | null;
  currency?: string;
  rating?: number; // 0 à 5
  reviewCount?: number;
  isFreeShipping?: boolean;
  isCod?: boolean;
  unitPrice?: number;
  quantitySelected?: number;
  className?: string;
  isCompact?: boolean; // Pour les cartes de catalogue
}

export function ProductPriceBlock({
  currentPrice,
  compareAtPrice,
  currency = "FCFA",
  rating = 0,
  reviewCount = 0,
  isFreeShipping = true,
  isCod = true,
  unitPrice,
  quantitySelected,
  className = "",
  isCompact = false,
}: ProductPriceBlockProps) {
  // Calcul de la réduction réelle si l'ancien prix est supérieur
  const hasDiscount = !!compareAtPrice && compareAtPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - currentPrice) / compareAtPrice) * 100)
    : 0;

  // Formatage des montants avec espace insécable
  const formatAmount = (num: number) => {
    return num.toLocaleString("fr-FR").replace(/\s/g, "\u00A0");
  };

  const hasReviews = rating > 0 && reviewCount > 0;

  // Texte pour lecteur d'écran
  const screenReaderText = `${hasDiscount ? `Prix actuel ${formatAmount(currentPrice)} ${currency}, ancien prix ${formatAmount(compareAtPrice!)} ${currency}, réduction de ${discountPercent} pour cent.` : `Prix ${formatAmount(currentPrice)} ${currency}.`} ${hasReviews ? `Note de ${rating.toFixed(1)} sur 5 basée sur ${reviewCount} avis vérifiés.` : ""}`;

  return (
    <div className={cn("space-y-2 select-none", className)} aria-label={screenReaderText}>
      {/* LIGNE 1 : Étoiles et avis (affiché UNIQUEMENT si avis vérifiés réels) */}
      {hasReviews && !isCompact && (
        <div className="flex items-center gap-1.5 text-xs text-[#555550]">
          <div className="flex items-center text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-3.5 w-3.5",
                  star <= Math.round(rating)
                    ? "fill-amber-400 text-amber-500"
                    : "fill-black/[0.06] text-black/[0.2]"
                )}
              />
            ))}
          </div>
          <span className="font-bold text-[#111111]">{rating.toFixed(1)}</span>
          <span className="text-[#888880]">({reviewCount} avis vérifiés)</span>
        </div>
      )}

      {/* LIGNE 2 : Ancien prix barré + Prix actuel en gras + Pastille -XX% */}
      <div className="flex items-baseline gap-2.5 flex-wrap whitespace-nowrap min-w-0">
        {/* Prix actuel en gras (28 à 32px sur bureau, 26px sur mobile) */}
        <div className="flex items-baseline gap-1 text-[#0B1521] font-black font-mono tracking-tight leading-none">
          <span className={cn(isCompact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl")}>
            {formatAmount(currentPrice)}
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#666660] font-sans">
            &nbsp;{currency}
          </span>
        </div>

        {/* Ancien prix barré */}
        {hasDiscount && (
          <span className="text-xs sm:text-sm line-through text-[#888880] font-mono">
            {formatAmount(compareAtPrice!)}&nbsp;{currency}
          </span>
        )}

        {/* Pastille de réduction arrondie */}
        {hasDiscount && discountPercent > 0 && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-[#D35400] text-white shadow-2xs whitespace-nowrap"
            aria-hidden="true"
          >
            −{discountPercent}&nbsp;%
          </span>
        )}

        {/* Prix unitaire indicatif si quantité multiple */}
        {quantitySelected && quantitySelected > 1 && unitPrice && (
          <span className="text-[11px] text-[#888880] font-medium block sm:inline">
            ({formatAmount(unitPrice)}&nbsp;{currency} / pièce)
          </span>
        )}
      </div>

      {/* LIGNE 3 : Pastilles de réassurance (Livraison gratuite & Paiement à la livraison) */}
      {!isCompact && (
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {isFreeShipping && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/[0.04] text-[#111111] border border-black/[0.08] whitespace-nowrap">
              <Truck className="h-3.5 w-3.5 text-[#D35400] shrink-0" />
              <span>Livraison gratuite</span>
            </span>
          )}
          {isCod && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/[0.04] text-[#111111] border border-black/[0.08] whitespace-nowrap">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
              <span>Paiement à la livraison</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
