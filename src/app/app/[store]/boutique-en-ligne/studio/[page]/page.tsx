import React, { Suspense } from "react";
import { StudioClient } from "./studio-client";

export default async function StudioPage({ params }: { params: Promise<{ store: string; page: string }> }) {
  const { store, page } = await params;
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[100] bg-white p-8 text-xs font-bold text-[#666660]">Chargement du Studio…</div>}>
      <StudioClient storeSlug={store} pageId={page} />
    </Suspense>
  );
}
