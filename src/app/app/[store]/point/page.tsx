import React from "react";
import { PointClient } from "./point-client";

export default async function PointPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <PointClient storeSlug={store} />;
}
