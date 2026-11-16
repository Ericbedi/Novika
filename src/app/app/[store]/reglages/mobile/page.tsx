import React, { Suspense } from "react";
import { MobilePwaClient } from "./mobile-pwa-client";

export default async function MobileSettingsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#888880]">Chargement des réglages mobiles...</div>}>
      <MobilePwaClient storeSlug={store} />
    </Suspense>
  );
}
