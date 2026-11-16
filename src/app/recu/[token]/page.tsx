import React from "react";
import { notFound } from "next/navigation";
import { MOCK_RECEIPTS_DATA } from "@/mock-data/receipts";
import { ReceiptPublicClient } from "./receipt-public-client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicReceiptPage({ params }: PageProps) {
  const { token } = await params;

  // Recherche du reçu correspondant au jeton public sécurisé
  const receipt = MOCK_RECEIPTS_DATA.find((r) => r.token === token) || null;

  if (!receipt) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-black/[0.08] shadow-sm space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl font-bold">
            !
          </div>
          <h1 className="text-xl font-black text-[#111111]">Reçu de livraison introuvable</h1>
          <p className="text-xs text-[#666660] leading-relaxed">
            Ce lien de reçu est invalide, a expiré ou a été révoqué. Si vous venez de recevoir votre commande, veuillez contacter la boutique pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );
  }

  return <ReceiptPublicClient initialReceipt={receipt} />;
}
