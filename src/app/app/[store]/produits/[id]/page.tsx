import React from "react";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_STORES } from "@/mock-data/stores";
import { getProductByShopAndSlugOrId } from "@/lib/products-store";
import { ProductFormClient } from "../product-form-client";

export function generateStaticParams() {
  const storeSlugs = MOCK_STORES.map((s) => s.slug);
  const params: { store: string; id: string }[] = [];
  for (const store of storeSlugs) {
    for (const prod of MOCK_PRODUCTS) {
      params.push({ store, id: prod.id });
    }
  }
  return params;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store, id } = await params;
  const product =
    getProductByShopAndSlugOrId({ shopSlug: store, slugOrId: id, allowDraft: true }) ||
    MOCK_PRODUCTS.find((p) => p.id === id || p.slug === id) ||
    MOCK_PRODUCTS[0];

  return (
    <ProductFormClient
      storeSlug={store}
      initialProduct={product}
      isEditing={true}
    />
  );
}
