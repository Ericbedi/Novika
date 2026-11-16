import React from "react";
import { SettingsClient } from "../settings-client";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return <SettingsClient storeSlug={store} initialSection="team" />;
}
