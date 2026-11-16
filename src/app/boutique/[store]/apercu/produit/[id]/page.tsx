"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { Eye, ShieldAlert, ArrowLeft, Clock, Lock } from "lucide-react";
import { MOCK_STORES } from "@/mock-data/stores";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import {
  MOCK_ORDER_FORM_SETTINGS,
  MOCK_QUANTITY_OFFERS,
  MOCK_PRODUCT_SECTIONS,
  MOCK_SHOP_GUARANTEES,
  MOCK_PRODUCT_REVIEWS,
} from "@/mock-data/product-page-data";
import { buildProductThemePalette } from "@/lib/color-extractor";
import { CodProductPageTemplate } from "@/components/storefront/cod-product-page-template";

export default function ProductPreviewPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store: storeSlug, id: productId } = use(params);
  const store = MOCK_STORES.find((s) => s.slug === storeSlug) || MOCK_STORES[0];

  const targetId =
    productId === "prod_coffee" ? "prod_01" : productId === "prod_serum" ? "prod_02" : productId;

  // Récupérer le produit (sans filtrer sur actif, car c'est un aperçu privé de brouillon)
  const product =
    MOCK_PRODUCTS.find((p) => p.id === targetId || p.slug === targetId) ||
    MOCK_PRODUCTS[0];

  // Gestion de l'expiration du jeton (30 min)
  const [minutesRemaining, setMinutesRemaining] = useState(29);

  useEffect(() => {
    const timer = setInterval(() => {
      setMinutesRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const productOffers = MOCK_QUANTITY_OFFERS.filter(
    (q) => q.productId === product.id || q.productId === "prod_coffee"
  );

  const productPalette = buildProductThemePalette(
    product.id,
    product.id === "prod_coffee" ? "#6F4E37" : "#C06C84",
    "#059669"
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Balise méta noindex injectée */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
        <title>{`Aperçu privé : ${product.name} — AfriBuilder`}</title>
      </head>

      {/* Bandeau d'aperçu privé obligatoire */}
      <div
        id="preview-mode-banner"
        className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#111111] text-[#FAF8F5] border-b border-white/10 shadow-lg text-xs"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-black uppercase tracking-wider text-amber-400">
            Aperçu privé
          </span>
          <span className="hidden sm:inline text-white/70">·</span>
          <span className="hidden sm:inline text-white/90">
            Non visible par les clients (Produit en mode {product.productStatus || "Brouillon"})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/70 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Expire dans {minutesRemaining} min</span>
          </div>

          <Link
            href={`/app/${storeSlug}/produits/${product.id}`}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Retour à la fiche</span>
          </Link>
        </div>
      </div>

      {/* Rendu du modèle de vitrine avec le produit */}
      <CodProductPageTemplate
        product={product}
        sections={MOCK_PRODUCT_SECTIONS}
        settings={MOCK_ORDER_FORM_SETTINGS}
        quantityOffers={productOffers.length > 0 ? productOffers : MOCK_QUANTITY_OFFERS}
        palette={productPalette}
        reviews={MOCK_PRODUCT_REVIEWS}
        guarantees={MOCK_SHOP_GUARANTEES}
        storeSlug={storeSlug}
      />
    </div>
  );
}
