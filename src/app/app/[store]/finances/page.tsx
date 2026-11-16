import React from "react";
import { FinancesClient } from "./finances-client";

export default async function FinancesPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <FinancesClient storeSlug={store} />;
}
