import { redirect } from "next/navigation";

// Prompt 05-Z : Redirection de l'ancienne adresse /reglages/pays-zones vers les Réglages
export default async function LegacyPaysZonesPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  redirect(`/app/${store}/reglages`);
}
