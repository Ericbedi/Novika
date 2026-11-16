import React from "react";
import { ProductsListClient } from "./products-list-client";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <ProductsListClient storeSlug={store} />;
}
