import React from "react";
import { FollowupsClient } from "./followups-client";

export default async function FollowupsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <FollowupsClient storeSlug={store} />;
}
