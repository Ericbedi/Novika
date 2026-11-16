import React, { Suspense } from "react";
import { IntegrationsClient } from "./integrations-client";

export default async function ConnexionsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#888880]">Chargement des intégrations...</div>}>
      <IntegrationsClient storeSlug={store} />
    </Suspense>
  );
}
