import { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Connexion | Kelio",
  description: "Connectez-vous à votre espace vendeur Kelio.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3EFE6] flex items-center justify-center">Chargement...</div>}>
      <LoginClient />
    </Suspense>
  );
}
