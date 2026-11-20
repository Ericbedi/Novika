import React, { Suspense } from "react";
import { StockSettingsClient } from "./stock-settings-client";

export default async function StockSettingsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#888880]">Chargement des réglages de stock...</div>}>
      <StockSettingsClient storeSlug={store} />
    </Suspense>
  );
}
