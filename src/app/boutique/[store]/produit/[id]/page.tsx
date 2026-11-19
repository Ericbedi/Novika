"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MOCK_STORES } from "@/mock-data/stores";
import {
  MOCK_ORDER_FORM_SETTINGS,
  MOCK_QUANTITY_OFFERS,
  MOCK_SHOP_GUARANTEES,
  MOCK_PRODUCT_REVIEWS,
} from "@/mock-data/product-page-data";
import { NovikaProductPage } from "@/components/storefront/product/NovikaProductPage";
import { getProductByShopAndSlugOrId } from "@/lib/products-store";
import { Product } from "@/server/data/types";
import { QuantityOffer } from "@/server/data/product-page-types";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store: storeSlug, id: productId } = use(params);
  const searchParams = useSearchParams();
  const urlTemplate = searchParams?.get("template") as any;

  const [product, setProduct] = useState<Product | null>(() => {
    return getProductByShopAndSlugOrId({
      shopSlug: storeSlug,
      slugOrId: productId,
      allowDraft: false,
    });
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = getProductByShopAndSlugOrId({
      shopSlug: storeSlug,
      slugOrId: productId,
      allowDraft: false,
    });
    setProduct(loaded);
    setIsLoaded(true);
  }, [storeSlug, productId]);

  // Si le produit n'existe pas ou n'est pas actif : Page 404 en français (Zéro repli sur un autre produit)
  if (isLoaded && !product) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-black/[0.04] flex items-center justify-center text-2xl font-black text-[#555550]">
          404
        </div>
        <h1 className="text-2xl font-black text-[#111111]">Produit introuvable ou indisponible</h1>
        <p className="text-sm text-[#666660] max-w-md mx-auto">
          Ce produit n'existe pas ou n'est plus actif dans le catalogue de cette boutique.
        </p>
        <div className="pt-4">
          <Link
            href={`/boutique/${storeSlug}/catalogue`}
            className="inline-flex px-6 py-2.5 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-colors"
          >
            Retourner au catalogue
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return null; // En cours de chargement initial
  }

  // Prix et offres de quantité dynamiques pour ce produit spécifique (Prompt 05-V)
  const productPrice = product.price || product.salePrice || 0;
  const productOffers: QuantityOffer[] = [
    {
      id: `q1_${product.id}`,
      productId: product.id,
      quantity: 1,
      label: "1 Unité",
      badge: "Découverte",
      unitPrice: productPrice,
      totalPrice: productPrice,
      savingsAmount: 0,
      isDefault: true,
    },
    {
      id: `q2_${product.id}`,
      productId: product.id,
      quantity: 2,
      label: "Pack Duo (2 Unités)",
      badge: "Populaire · -15%",
      unitPrice: Math.round(productPrice * 0.85),
      totalPrice: Math.round(productPrice * 0.85 * 2),
      savingsAmount: Math.round(productPrice * 2 - productPrice * 0.85 * 2),
      isDefault: false,
    },
    {
      id: `q3_${product.id}`,
      productId: product.id,
      quantity: 3,
      label: "Pack Famille (3 Unités)",
      badge: "Meilleure offre · -25%",
      unitPrice: Math.round(productPrice * 0.75),
      totalPrice: Math.round(productPrice * 0.75 * 3),
      savingsAmount: Math.round(productPrice * 3 - productPrice * 0.75 * 3),
      isDefault: false,
    },
  ];

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
            image: product.images || [],
            description: product.description || "",
            offers: {
              "@type": "Offer",
              priceCurrency: "XOF",
              price: productPrice,
              availability: "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
            },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              reviewCount: "28",
            },
          }),
        }}
      />

      <NovikaProductPage
        product={product}
        settings={MOCK_ORDER_FORM_SETTINGS}
        quantityOffers={productOffers}
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
        template={urlTemplate || (product as any).pageTemplate || (product as any).template}
      />
    </>
  );
}
