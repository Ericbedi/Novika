import React from "react";
import { DepensesClient } from "./depenses-client";

export default async function ExpensesPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <DepensesClient storeSlug={store} />;
}
