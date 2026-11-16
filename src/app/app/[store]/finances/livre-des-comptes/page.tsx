import React from "react";
import { WaterfallClient } from "../livre-de-compte/waterfall-client";

export default async function LivreDesComptesPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <WaterfallClient storeSlug={store} />;
}
