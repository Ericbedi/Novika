import React, { Suspense } from "react";
import { StorefrontClient } from "./storefront-client";

export default async function BoutiqueEnLignePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-xs font-bold text-[#666660]">Chargement de l'éditeur de boutique...</div>}>
      <StorefrontClient storeSlug={store} />
    </Suspense>
  );
}
