import React from "react";
import { ActiviteClient } from "../activite/activite-client";

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <ActiviteClient storeSlug={store} />;
}
