import React from "react";
import { UserCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export default function AccountPage() {
  return (
    <PlaceholderPage
      title="Mon Compte Utilisateur"
      description="Profil, sécurité, mot de passe et préférences de notification"
      section="Compte"
      icon={UserCheck}
      backHref="/app/lome-glow"
      promptStep="5.B"
    />
  );
}
