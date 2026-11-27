import React from "react";
import { OrderFormClient } from "./order-form-client";

export default async function OrderFormSettingsPage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  return <OrderFormClient storeSlug={store} />;
}
