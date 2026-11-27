import React from "react";
import { RidersClient } from "./riders-client";

export default async function CouriersPage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  return <RidersClient storeSlug={store} />;
}
