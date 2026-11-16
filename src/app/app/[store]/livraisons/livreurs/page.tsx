import React from "react";
import { Truck } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export default async function CouriersPage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store } = await params;
  return (
    <PlaceholderPage
      title="Gestion des Livreurs"
      description="Coordonnées, tarifs par course et affectation des colis du jour"
      section="Livreurs"
      icon={Truck}
      backHref={`/app/${store}/livraisons`}
      promptStep="5.C"
    />
  );
}
