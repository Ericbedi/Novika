import React from "react";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_STORES } from "@/mock-data/stores";
import { getProductByShopAndSlugOrId } from "@/lib/products-store";
import { ProductEditContainer } from "../../product-edit-container";

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

export default async function ProductModifierPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store, id } = await params;

  // Filtrage strict par boutique ET identifiant (Prompt 17-J)
  // Route canonique /produits/{id}/modifier
  const product = getProductByShopAndSlugOrId({
    shopSlug: store,
    slugOrId: id,
    allowDraft: true,
    includeDeleted: true,
  });

  return (
    <ProductEditContainer
      storeSlug={store}
      productId={id}
      initialServerProduct={product}
    />
  );
}
