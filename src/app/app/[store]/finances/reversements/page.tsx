import React from "react";
import { RemittancesClient } from "./remittances-client";

export default async function RemittancesPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <RemittancesClient storeSlug={store} />;
}
