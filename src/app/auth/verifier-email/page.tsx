import { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailClient } from "./verify-email-client";

export const metadata: Metadata = {
  title: "Vérifier votre adresse e-mail | AfriBuilder",
  description: "Entrez le code à 6 chiffres reçu par e-mail pour activer votre compte.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#888880]">Chargement de la vérification...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
