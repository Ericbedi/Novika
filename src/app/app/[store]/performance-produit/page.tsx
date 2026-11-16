import React from "react";
import { ScalingClient } from "./scaling-client";

export default async function ProductPerformancePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <ScalingClient storeSlug={store} />;
}
