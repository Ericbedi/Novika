import React from "react";
import { ClosersClient } from "./closers-client";

export default async function ClosersPage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  return <ClosersClient storeSlug={store} />;
}
