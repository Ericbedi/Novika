import React, { Suspense } from "react";
import { PurchaseOrdersClient } from "../achats/purchase-orders-client";

export default async function ProductSourcingPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-xs font-bold text-[#666660]">Chargement du sourcing...</div>}>
      <PurchaseOrdersClient storeSlug={store} />
    </Suspense>
  );
}
