"use client";

import React from "react";
import Link from "next/link";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { FeaturedProductSettings } from "@/lib/theme-engine/schemas";
import { Product } from "@/server/data/types";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatFcfa } from "@/lib/money";
import { Star, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedProductSectionProps {
  settings: FeaturedProductSettings;
  palette: ThemeColorPalette;
  products: Product[];
  storeSlug: string;
  cardRadius?: BorderRadiusOption;
  buttonRadius?: BorderRadiusOption;
}

export function FeaturedProductSection({
  settings,
  palette,
  products = [],
  storeSlug,
  cardRadius = "md",
  buttonRadius = "md",
}: FeaturedProductSectionProps) {
  if (!settings.productId) return null;

  const product = products.find(
    (p) => p.id === settings.productId || p.slug === settings.productId
  );
  if (!product) return null;

  const radiusClass =
    cardRadius === "none"
      ? "rounded-none"
      : cardRadius === "sm"
      ? "rounded-xl"
      : cardRadius === "lg"
      ? "rounded-3xl"
      : "rounded-2xl";

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

  const price = product.price || product.salePrice || 0;
  const compareAt = product.compareAtPrice || 0;
  const targetSlug = product.slug || product.id;

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 sm:p-10 border shadow-2xs max-w-5xl mx-auto",
        radiusClass
      )}
      style={{
        backgroundColor: palette.cardBackground || palette.background,
        borderColor: palette.borderColor || "transparent",
      }}
    >
      <div className={cn("relative aspect-square w-full overflow-hidden shadow-2xs", radiusClass)}>
        <ProductImage
          src={(product.images && product.images[0]) || ""}
          alt={product.title || product.name}
          fill
          priority
          fallbackLabel={product.title || product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="space-y-4">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider">
          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          <span>Produit vedette</span>
        </div>

        <h2 className="text-xl sm:text-3xl font-black tracking-tight leading-tight">
          {product.title || product.name}
        </h2>

        {product.description && (
          <p className="text-xs sm:text-sm font-medium opacity-80 leading-relaxed line-clamp-3">
            {product.description}
          </p>
        )}

        <div className="flex items-baseline gap-3 pt-2">
          <span className="text-2xl font-black">{formatFcfa(price)}</span>
          {compareAt > price && (
            <span className="text-sm line-through opacity-60 font-bold">
              {formatFcfa(compareAt)}
            </span>
          )}
        </div>

        <div className="pt-2">
          <Link
            href={`/boutique/${storeSlug}/produit/${targetSlug}`}
            className={cn(
              "inline-flex items-center justify-center gap-2 px-8 py-3.5 text-xs sm:text-sm font-black transition-transform active:scale-95 shadow-md",
              btnRadiusClass
            )}
            style={{
              backgroundColor: palette.button,
              color: palette.buttonText,
            }}
          >
            <span>Commander maintenant</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
