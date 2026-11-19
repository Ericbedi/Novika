"use client";

import React from "react";
import { Star, ShieldCheck, CheckCircle2 } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { VerifiedReviewsSettings } from "@/lib/theme-engine/schemas";
import { CustomerReview } from "@/server/data/storefront-types";
import { cn } from "@/lib/utils";

interface VerifiedReviewsSectionProps {
  settings: VerifiedReviewsSettings;
  palette: ThemeColorPalette;
  reviews: CustomerReview[]; // UNIQUEMENT des avis de commandes livrées
  cardRadius?: BorderRadiusOption;
}

export function VerifiedReviewsSection({
  settings,
  palette,
  reviews = [],
  cardRadius = "md",
}: VerifiedReviewsSectionProps) {
  const { title, subtitle, maxReviews = 6, showRatingSummary = true } = settings;

  // Règle Prompt 12 : Uniquement les vrais avis avec commande livrée confirmée
  const verifiedReviews = reviews.filter((r) => r.verifiedPurchase).slice(0, maxReviews);

  // Si aucun avis vérifié n'existe (par exemple pour une nouvelle boutique), la section est masquée
  if (verifiedReviews.length === 0) return null;

  const averageRating = (
    verifiedReviews.reduce((acc, r) => acc + r.rating, 0) / verifiedReviews.length
  ).toFixed(1);

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

  return (
    <div className="space-y-8">
      {/* En-tête avec résumé de notation */}
      <div className="text-center space-y-3 max-w-2xl mx-auto px-4">
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

        {showRatingSummary && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-2xs text-xs font-bold bg-white/70">
            <div className="flex items-center gap-0.5 text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3.5 h-3.5",
                    i < Math.round(Number(averageRating))
                      ? "fill-amber-400 text-amber-500"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="font-black">{averageRating} / 5</span>
            <span className="opacity-40">·</span>
            <span className="opacity-70 font-semibold">{verifiedReviews.length} avis vérifiés COD</span>
          </div>
        )}
      </div>

      {/* Grille des avis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verifiedReviews.map((review) => (
          <div
            key={review.id}
            className={cn("p-5 border shadow-2xs flex flex-col justify-between space-y-4", radiusClass)}
            style={{
              backgroundColor: palette.cardBackground || palette.background,
              color: palette.text,
              borderColor: palette.borderColor || "transparent",
            }}
          >
            <div className="space-y-2.5">
              {/* Étoiles et Badge Achat vérifié */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-0.5 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        i < review.rating ? "fill-amber-400 text-amber-500" : "text-gray-300"
                      )}
                    />
                  ))}
                </div>

                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Livraison vérifiée</span>
                </span>
              </div>

              {/* Commentaire client */}
              <p className="text-xs sm:text-sm font-medium leading-relaxed opacity-90 italic">
                « {review.comment} »
              </p>
            </div>

            {/* Auteur et ville */}
            <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-[11px]">
              <span className="font-black">{review.authorName}</span>
              <span className="opacity-60">{review.authorCity}, {review.authorCountry}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
