import React, { Suspense } from "react";
import { QuickOrderClient } from "./quick-order-client";

export default async function QuickOrderPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#888880]">Chargement de la commande rapide...</div>}>
      <QuickOrderClient storeSlug={store} />
    </Suspense>
  );
}
