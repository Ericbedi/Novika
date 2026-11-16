import React from "react";
import { MapPin } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export default async function ZonesPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <PlaceholderPage
      title="Zones de Livraison & Tarifs"
      description="Découpage par ville, commune et frais de livraison appliqués au client"
      section="Zones"
      icon={MapPin}
      backHref={`/app/${store}/livraisons`}
      promptStep="5.C"
    />
  );
}
