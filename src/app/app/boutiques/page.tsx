import React from "react";
import { Store as StoreIcon } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function BoutiquesPage() {
  return (
    <PlaceholderPage
      title="Mes Boutiques"
      description="Gestion des boutiques COD : Togo, Côte d'Ivoire, Sénégal et Bénin"
      section="Boutiques"
      icon={StoreIcon}
      backHref="/app/lome-glow"
      promptStep="5.B"
    />
  );
}
