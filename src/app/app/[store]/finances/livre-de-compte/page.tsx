import React from "react";
import { WaterfallClient } from "./waterfall-client";

export default async function GeneralLedgerPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <WaterfallClient storeSlug={store} />;
}
