import React from "react";
import { CollectionsClient } from "./collections-client";

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <CollectionsClient storeSlug={store} />;
}
