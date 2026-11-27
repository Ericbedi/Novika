import { redirect } from "next/navigation";

export default async function ZonesPage({ params }: { params: Promise<{ store: string }> }) {
  const { store } = await params;
  redirect(`/app/${store}/livraisons/tarifs`);
}
