import React from "react";
import { NewManualOrderClient } from "./new-order-client";

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <NewManualOrderClient storeSlug={store} />;
}
