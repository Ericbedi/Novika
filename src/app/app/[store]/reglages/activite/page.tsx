import React from "react";
import { ActiviteClient } from "./activite-client";

export default async function ActivitePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <ActiviteClient storeSlug={store} />;
}
