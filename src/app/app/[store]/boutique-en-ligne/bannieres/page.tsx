import { redirect } from "next/navigation";

// Les bannières se gèrent désormais dans « Apparence » (enregistrées en base, visibles sur la vitrine)
export default async function BannersPage(props: { params: Promise<{ store: string }> }) {
  const { store } = await props.params;
  redirect(`/app/${store}/boutique-en-ligne/apparence`);
}
