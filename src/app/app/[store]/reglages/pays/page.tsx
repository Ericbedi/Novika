import { redirect } from "next/navigation";

// Prompt 05-Z : Redirection de l'ancienne adresse /reglages/pays vers les Réglages généraux
export default async function CountriesSettingsPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  redirect(`/app/${store}/reglages`);
}
