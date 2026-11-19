"use client";

import React, { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
import { NovikaProductPage } from "@/components/storefront/product/NovikaProductPage";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store: storeSlug, id: productId } = use(params);
  const store = MOCK_STORES.find((s) => s.slug === storeSlug) || MOCK_STORES[0];

  const targetId =
    productId === "prod_coffee" ? "prod_01" : productId === "prod_serum" ? "prod_02" : productId;

  // Récupérer le produit (par id ou slug)
  const product =
    MOCK_PRODUCTS.find((p) => (p.id === targetId || p.slug === targetId) && p.productStatus === "active") ||
    MOCK_PRODUCTS.find((p) => p.id === "prod_01") ||
    MOCK_PRODUCTS[0];

  if (!product) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <h1 className="text-xl font-black text-[#111111]">Produit introuvable ou indisponible</h1>
        <p className="text-xs text-[#666660]">Ce produit n'est plus actif dans le catalogue de cette boutique.</p>
        <Link
          href={`/boutique/${storeSlug}/catalogue`}
          className="inline-flex px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold"
        >
          Retour au catalogue
        </Link>
      </div>
    );
  }

  // Filtrer les offres de quantité du produit
  const productOffers = MOCK_QUANTITY_OFFERS.filter((q) => q.productId === product.id || q.productId === "prod_coffee");

  // Dériver la palette de couleur du produit à partir de sa couleur d'image
  const productPalette = buildProductThemePalette(
    product.id,
    product.id === "prod_coffee" ? "#6F4E37" : "#C06C84",
    "#059669"
  );

  return (
    <>
      {/* Données structurées JSON-LD Schema.org Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: product.title || product.name,
            image: product.images,
            description: product.description,
            offers: {
              "@type": "Offer",
              priceCurrency: "XOF",
              price: product.price || product.salePrice,
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.8",
              reviewCount: "142",
            },
          }),
        }}
      />

      <NovikaProductPage
        product={product}
        settings={MOCK_ORDER_FORM_SETTINGS}
        quantityOffers={productOffers.length > 0 ? productOffers : MOCK_QUANTITY_OFFERS}
        reviews={MOCK_PRODUCT_REVIEWS.map((r) => ({
          id: r.id,
          authorName: r.customerName,
          authorCity: r.customerCity,
          authorCountry: "TG",
          rating: r.rating,
          comment: r.comment,
          date: r.createdAt,
          verifiedPurchase: r.isVerifiedBuyer,
        }))}
        guarantees={MOCK_SHOP_GUARANTEES}
        storeSlug={storeSlug}
      />
    </>
  );
}
