import React from "react";
import { CaisseClient } from "./caisse-client";

export default async function CaissePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <CaisseClient storeSlug={store} />;
}
