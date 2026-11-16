import React from "react";
import { PubliciteClient } from "./publicite-client";

export default async function AdvertisingPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <PubliciteClient storeSlug={store} />;
}
