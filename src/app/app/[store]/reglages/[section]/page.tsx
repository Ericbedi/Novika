import React from "react";
import { SettingsClient } from "../settings-client";

export default async function SettingsSectionPage({
  params,
}: {
  params: Promise<{ store: string; section: string }>;
}) {
  const { store, section } = await params;
  return <SettingsClient storeSlug={store} initialSection={section} />;
}
