import React from "react";
import { ProductFormClient } from "../product-form-client";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <ProductFormClient storeSlug={store} isEditing={false} />;
}
