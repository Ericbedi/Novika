import React from "react";
import { DeliveryRatesClient } from "./delivery-rates-client";

export default async function DeliveryRatesPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <DeliveryRatesClient storeSlug={store} />;
}
