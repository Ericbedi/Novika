import React from "react";
import { ImportExportClient } from "./import-export-client";

export default async function ImportExportPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <ImportExportClient storeSlug={store} />;
}
