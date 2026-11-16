import React from "react";
import { DeliveriesClient } from "./deliveries-client";

export default async function DeliveriesPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <DeliveriesClient storeSlug={store} />;
}
