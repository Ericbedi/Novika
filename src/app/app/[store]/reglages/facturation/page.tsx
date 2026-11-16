import React, { Suspense } from "react";
import { BillingClient } from "./billing-client";

export default async function BillingPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#888880]">Chargement de la facturation...</div>}>
      <BillingClient storeSlug={store} />
    </Suspense>
  );
}
