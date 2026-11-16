import React from "react";
import { CollectionsClient } from "../../collections/collections-client";

export default async function ProductCollectionsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <CollectionsClient storeSlug={store} />;
}
