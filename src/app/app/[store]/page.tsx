import React from "react";
import { DashboardClient } from "./dashboard-client";

export const metadata = {
  title: "Tableau de bord",
  description: "Vue d'ensemble des ventes, livraisons et indicateurs clés",
};

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;

  return <DashboardClient storeSlug={store} />;
}
