import React from "react";
import { AbandonedClient } from "./abandoned-client";

export default async function AbandonedOrdersPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <AbandonedClient storeSlug={store} />;
}
