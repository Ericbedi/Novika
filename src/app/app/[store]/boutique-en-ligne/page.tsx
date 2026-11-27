import React, { Suspense } from "react";
import { StorefrontHub } from "./storefront-hub";

export default async function BoutiqueEnLignePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-xs font-bold text-[#666660]">Chargement…</div>}>
      <StorefrontHub storeSlug={store} />
    </Suspense>
  );
}
