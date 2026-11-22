import React, { Suspense } from "react";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ store: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { store } = await params;
  const sParams = searchParams ? await searchParams : {};
  return (
    <Suspense fallback={<div className="p-8 text-xs font-bold text-[#666660]">Chargement des réglages...</div>}>
      <SettingsClient storeSlug={store} initialSection={sParams.tab || "general"} />
    </Suspense>
  );
}
