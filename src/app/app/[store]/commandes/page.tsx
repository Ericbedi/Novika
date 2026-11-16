import React, { Suspense } from "react";
import { OrdersListClient } from "./orders-list-client";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#888880]">Chargement des commandes...</div>}>
      <OrdersListClient storeSlug={store} />
    </Suspense>
  );
}
