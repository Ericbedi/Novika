import React from "react";
import { StoresManagementClient } from "./stores-management-client";

export default async function BoutiquesManagementPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <StoresManagementClient storeSlug={store} />;
}
