import React from "react";
import { ProductPerformanceClient } from "./product-performance-client";

export default async function ProductPerformancePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <ProductPerformanceClient storeSlug={store} />;
}
