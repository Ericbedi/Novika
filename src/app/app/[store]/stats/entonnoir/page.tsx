import React from "react";
import { FunnelClient } from "./funnel-client";

export default async function FunnelPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <FunnelClient storeSlug={store} />;
}
