import React, { Suspense } from "react";
import { ReceiptsListClient } from "./receipts-list-client";

interface PageProps {
  params: Promise<{ store: string }>;
}

export default async function ReceiptsPage({ params }: PageProps) {
  const { store } = await params;

  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#888880]">
          Chargement des reçus de livraison...
        </div>
      }
    >
      <ReceiptsListClient storeSlug={store} />
    </Suspense>
  );
}
