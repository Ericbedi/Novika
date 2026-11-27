import React from "react";
import { safeDecode } from "@/lib/slug";
import { Metadata } from "next";
import { resolveStorefrontDataAsync } from "@/lib/storefront-resolver-server";
import { findProductInShopRaw } from "@/lib/products-store";
import { ProductCanonicalDetailPageClient } from "./product-detail-client";

interface ProductPageProps {
  params: Promise<{ store: string; id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { store: storeSlug, id: rawId } = await params;
  const productId = safeDecode(rawId);
  await resolveStorefrontDataAsync(storeSlug);
  const raw = findProductInShopRaw(storeSlug, productId);
  const productName = raw.product?.title || raw.product?.name || "Produit";

  return {
    title: `${productName} — Boutique Officielle Paiement à la Livraison`,
    description: raw.product?.description || "Commandez en ligne et payez en espèces à la livraison.",
  };
}

export default async function ProductCanonicalDetailPage({ params }: ProductPageProps) {
  const { store: storeSlug, id: rawId } = await params;
  const productId = safeDecode(rawId);
  await resolveStorefrontDataAsync(storeSlug);
  const initialRaw = findProductInShopRaw(storeSlug, productId);

  return (
    <ProductCanonicalDetailPageClient
      storeSlug={storeSlug}
      productId={productId}
      initialRaw={initialRaw}
    />
  );
}
