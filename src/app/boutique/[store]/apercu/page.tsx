import React from "react";
import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import { MOCK_STORES } from "@/mock-data/stores";
import BoutiqueHomePage from "../page";

export default async function StorefrontPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ store: string }>;
  searchParams: Promise<{ preview_token?: string }>;
}) {
  const { store: storeSlug } = await params;
  const store = MOCK_STORES.find((s) => s.slug === storeSlug) || MOCK_STORES[0];

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      {/* Bandeau d'aperçu privé de la boutique */}
      <div
        id="preview-mode-banner"
        className="sticky top-0 z-50 bg-[#111111] text-[#FAF8F5] px-4 py-2.5 flex items-center justify-between text-xs border-b border-white/10 shadow-md"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black">
            Aperçu privé
          </span>
          <span className="font-medium text-white/90">
            Boutique non publiée — Non visible par les clients
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-white/70 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Expire dans 30 min</span>
          </div>

          <Link
            href={`/app/${storeSlug}/boutique-en-ligne`}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Retour à l'éditeur</span>
          </Link>
        </div>
      </div>

      <BoutiqueHomePage params={params} searchParams={searchParams} />
    </div>
  );
}
