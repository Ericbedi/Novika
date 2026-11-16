import React from "react";
import { StockClient } from "./stock-client";

export default async function StockPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <StockClient storeSlug={store} />;
}
