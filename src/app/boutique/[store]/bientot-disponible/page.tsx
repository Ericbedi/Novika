import React from "react";
import Link from "next/link";
import { Sparkles, MessageCircle, Clock, ShieldCheck } from "lucide-react";
import { MOCK_STORES } from "@/mock-data/stores";
import { MOCK_STOREFRONT_LOME } from "@/mock-data/storefront-data";

export default async function BoutiqueBientotDisponiblePage({
  params,
}: {
  params: Promise<{ store: string }>;
}) {
  const { store: storeSlug } = await params;
  const store = MOCK_STORES.find((s) => s.slug === storeSlug) || MOCK_STORES[0];
  const storefront = MOCK_STOREFRONT_LOME;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4 text-[#111111]">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-black/10 p-8 sm:p-10 text-center space-y-6 shadow-xl">
        <div className="h-16 w-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
          <Sparkles className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full">
            Ouverture Prochaine
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            {store.name} Arrive Bientôt !
          </h1>
          <p className="text-xs text-[#666660] leading-relaxed max-w-md mx-auto">
            Notre boutique en ligne finalise actuellement la mise en place de ses produits certifiés et de son réseau de livraison express en espèces ({store.countryName}).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] text-xs text-[#444440] space-y-2">
          <div className="flex items-center justify-center gap-2 font-bold text-[#111111]">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Paiement 100% à la livraison (Cash on Delivery)</span>
          </div>
          <p className="text-[11px] text-[#666660]">
            Vous ne paierez rien en ligne. Tout se réglera directement auprès du livreur après vérification de votre colis.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <p className="text-xs font-bold text-[#111111]">Besoin d'une information urgente ?</p>
          <a
            href={`https://wa.me/${storefront.contact.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
              `Bonjour ${store.name}, je souhaite savoir quand votre boutique en ligne sera accessible.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:bg-[#20bd5a] transition-all shadow-sm"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Contacter le vendeur sur WhatsApp</span>
          </a>
        </div>

        <div className="pt-4 border-t border-black/[0.06] text-[11px] text-[#888880]">
          Plateforme propulsée par AfriBuilder.
        </div>
      </div>
    </div>
  );
}
