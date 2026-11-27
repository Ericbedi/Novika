import { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "./connexion/login-client";

export const metadata: Metadata = {
  title: "Kelio",
  description: "Plateforme de gestion e-commerce privée.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-xs text-[#777770]">Chargement...</div>}>
      <LoginClient />
    </Suspense>
  );
}
