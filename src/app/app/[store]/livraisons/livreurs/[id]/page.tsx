import React from "react";
import { Truck } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export default async function CourierDetailPage({
  params,
}: {
  params: Promise<{ store: string; id: string }>;
}) {
  const { store, id } = await params;
  return (
    <PlaceholderPage
      title={`Fiche Livreur #${id}`}
      description="Historique des livraisons, encaissements reversés et zone attribuée"
      section="Fiche Livreur"
      icon={Truck}
      backHref={`/app/${store}/livraisons/livreurs`}
      promptStep="5.C"
    />
  );
}
