import React, { Suspense } from "react";
import { PagesClient } from "./pages-client";

export default async function StorePagesPage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-xs font-bold text-[#666660]">Chargement…</div>}>
      <PagesClient storeSlug={store} />
    </Suspense>
  );
}
