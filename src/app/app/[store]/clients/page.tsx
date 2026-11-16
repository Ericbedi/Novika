import React from "react";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <CustomersClient storeSlug={store} />;
}
