import { Metadata } from "next";
import { ObjectivesClient } from "./objectives-client";

export const metadata: Metadata = {
  title: "Objectifs de chiffre d'affaires | Finances",
  description: "Suivez vos objectifs de CA encaissé réel avec barres de progression segmentées et calcul du rythme quotidien.",
};

export default async function ObjectivesPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const resolvedParams = await params;
  return <ObjectivesClient storeSlug={resolvedParams.store} />;
}
