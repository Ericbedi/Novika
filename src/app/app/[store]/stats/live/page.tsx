import React, { Suspense } from "react";
import { LiveStatsClient } from "./live-stats-client";

export default async function LiveStatsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;

  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs font-bold text-[#666660]">
          Initialisation de la télémétrie en direct...
        </div>
      }
    >
      <LiveStatsClient storeSlug={store} />
    </Suspense>
  );
}
