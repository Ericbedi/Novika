import { Suspense } from "react";
import { PurchaseOrdersClient } from "./purchase-orders-client";

interface PurchaseOrdersPageProps {
  params: Promise<{
    store: string;
  }>;
}

export default async function PurchaseOrdersPage({ params }: PurchaseOrdersPageProps) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-xs font-bold text-[#666660]">Chargement des achats...</div>}>
      <PurchaseOrdersClient storeSlug={store} />
    </Suspense>
  );
}
