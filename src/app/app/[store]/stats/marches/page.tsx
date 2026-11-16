import React from "react";
import { MarketStatsClient } from "./market-stats-client";

interface PageProps {
  params: Promise<{ store: string }>;
}

export default async function MarketStatsPage({ params }: PageProps) {
  const { store } = await params;
  return <MarketStatsClient storeSlug={store} />;
}
