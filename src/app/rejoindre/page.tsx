import { Metadata } from "next";
import { Suspense } from "react";
import { JoinClient } from "./join-client";

export const metadata: Metadata = {
  title: "Rejoindre l'équipe | Novika",
  description: "Finalisez votre invitation pour accéder à l'espace de votre équipe Novika.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-xs text-[#777770]">Chargement...</div>}>
      <JoinClient />
    </Suspense>
  );
}
