import React from "react";
import { notFound } from "next/navigation";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { ProductFormClient } from "../product-form-client";

export function generateStaticParams() {
  const stores = ["lome-lux", "abidjan-bio"];
  const params: { store: string; id: string }[] = [];
  for (const store of stores) {
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
  const product = MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];

  return (
    <ProductFormClient
      storeSlug={store}
      initialProduct={product}
      isEditing={true}
    />
  );
}
