"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Flame, Clock } from "lucide-react";
import { ThemeColorPalette, BorderRadiusOption } from "@/lib/theme-engine/types";
import { FeaturedProductsSettings } from "@/lib/theme-engine/schemas";
import { Product } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";
import { ProductImage } from "@/components/ui/ProductImage";
import { isProductVisibleOnStorefront } from "@/lib/stock-settings-store";
import { getProductPublicUrl } from "@/lib/storefront-urls";

interface FeaturedProductsSectionProps {
  settings: FeaturedProductsSettings;
  palette: ThemeColorPalette;
  products: Product[];
  storeSlug: string;
  cardRadius?: BorderRadiusOption;
  buttonRadius?: BorderRadiusOption;
}

export function FeaturedProductsSection({
  settings,
  palette,
  products = [],
  storeSlug,
  cardRadius = "md",
  buttonRadius = "md",
}: FeaturedProductsSectionProps) {
  const {
    title,
    subtitle,
    productIds = [],
    maxProducts = 4,
    columnsDesktop = 4,
    columnsMobile = 2,
    showDiscountBadge = true,
    showLowStockBadge = true,
  } = settings;

  // Filtrer les produits visibles selon la politique de stock
  let displayProducts = products.filter((p) => isProductVisibleOnStorefront(p, storeSlug));
  if (productIds.length > 0) {
    displayProducts = displayProducts.filter((p) => productIds.includes(p.id));
  }
  displayProducts = displayProducts.slice(0, maxProducts);

  if (displayProducts.length === 0) return null;

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

  // Grille responsive
  const colDesktopClass =
    columnsDesktop === 2
      ? "md:grid-cols-2"
      : columnsDesktop === 3
      ? "md:grid-cols-3"
      : "md:grid-cols-4";

  const colMobileClass = columnsMobile === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <div className="space-y-8" id="catalog-section">
      {(title || subtitle) && (
        <div className="text-center space-y-2 max-w-2xl mx-auto px-4">
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

      <div className={cn("grid gap-3 sm:gap-6", colMobileClass, colDesktopClass)}>
        {displayProducts.map((product) => {
          const price = product.price || product.salePrice || 0;
          const compareAt = product.compareAtPrice || 0;
          const hasDiscount = showDiscountBadge && compareAt > price;
          const stock = product.stockCount !== undefined ? product.stockCount : (product.stock || 0);
          const isLowStock = showLowStockBadge && stock > 0 && stock <= 10;
          const productImg = (product.images && product.images[0]) || "/images/placeholder-product.png";

            const targetSlugOrId = product.slug || product.id;

            return (
              <div
                key={product.id}
                className={cn(
                  "flex flex-col justify-between border overflow-hidden shadow-2xs hover:shadow-md transition-all group",
                  radiusClass
                )}
                style={{
                  backgroundColor: palette.cardBackground || palette.background,
                  color: palette.text,
                  borderColor: palette.borderColor || "transparent",
                }}
              >
                <Link
                  href={getProductPublicUrl(product, storeSlug)}
                  className="relative block aspect-square overflow-hidden bg-black/[0.03]"
                >
                  <ProductImage
                    src={productImg}
                    alt={product.title || product.name}
                    fill
                    fallbackLabel={product.title || product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Badges calculés automatiquement (Prompt 12) */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {hasDiscount && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                        <Flame className="w-2.5 h-2.5" />
                        <span>Promo</span>
                      </span>
                    )}
                    {isLowStock && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow-xs">
                        <Clock className="w-2.5 h-2.5" />
                        <span>Stock bas ({stock})</span>
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 space-y-3">
                  <div className="space-y-1">
                    <Link
                      href={getProductPublicUrl(product, storeSlug)}
                      className="block text-xs sm:text-sm font-black tracking-tight leading-snug line-clamp-2 hover:underline"
                    >
                      {product.title || product.name}
                    </Link>
                  {product.category && (
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">
                      {product.category}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-black" style={{ color: palette.button }}>
                      {formatFcfa(price)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] line-through opacity-50">
                        {formatFcfa(compareAt)}
                      </span>
                    )}
                  </div>

                  <Link
                    href={getProductPublicUrl(product, storeSlug)}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-black transition-all shadow-xs hover:scale-105 active:scale-95 shrink-0",
                      btnRadiusClass
                    )}
                    style={{
                      backgroundColor: palette.button,
                      color: palette.buttonText,
                    }}
                  >
                    <span>Commander</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
