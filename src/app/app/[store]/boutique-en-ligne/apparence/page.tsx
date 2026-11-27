import React from "react";
import { AppearanceClient } from "./appearance-client";

export default async function AppearancePage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  return <AppearanceClient storeSlug={store} />;
}
