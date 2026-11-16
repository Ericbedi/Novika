import React from "react";
import { OrderDetailClient } from "./order-detail-client";
import { MOCK_STORES } from "@/mock-data/stores";
import { MOCK_ORDERS } from "@/mock-data/orders";

export function generateStaticParams() {
  const params: { store: string; number: string }[] = [];
  MOCK_STORES.forEach((store) => {
    MOCK_ORDERS.forEach((order) => {
      params.push({ store: store.slug, number: order.orderNumber });
    });
  });
  return params;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ store: string; number: string }>;
}) {
  const { store, number } = await params;
  return <OrderDetailClient storeSlug={store} orderNumber={number} />;
}
