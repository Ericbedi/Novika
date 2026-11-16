import React from "react";
import { StatsClient } from "./stats-client";

export default async function StatisticsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <StatsClient storeSlug={store} />;
}
