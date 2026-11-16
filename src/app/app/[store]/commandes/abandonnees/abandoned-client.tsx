"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  DollarSign,
  Search,
} from "lucide-react";
import { MOCK_ABANDONED_CARTS } from "@/mock-data/abandoned-carts";
import { AbandonedCart } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { whatsappLink } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface AbandonedClientProps {
  storeSlug: string;
}

export function AbandonedClient({ storeSlug }: AbandonedClientProps) {
  const router = useRouter();
  const [carts, setCarts] = useState<AbandonedCart[]>(MOCK_ABANDONED_CARTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredCarts = carts.filter((c) => {
    return (
      searchQuery === "" ||
      c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerPhone.includes(searchQuery) ||
      c.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalLostRevenue = carts
    .filter((c) => !c.recovered)
    .reduce((acc, curr) => acc + curr.estimatedAmount, 0);

  const handleConvertToOrder = (cart: AbandonedCart) => {
    const newOrderNumber = `CMD-${Math.floor(10000 + Math.random() * 90000)}`;
    setCarts((prev) =>
      prev.map((c) => (c.id === cart.id ? { ...c, recovered: true } : c))
    );
    showToast(`Panier converti avec succès en commande #${newOrderNumber} !`);
    setTimeout(() => {
      router.push(`/app/${storeSlug}/commandes`);
    }, 1200);
  };

  const handleContactWhatsApp = (cart: AbandonedCart) => {
    const msg = `Bonjour ${cart.customerName}, vous avez commencé une commande pour ${cart.productName} sur notre boutique. Avez-vous rencontré un problème lors de la validation ? Nous pouvons finaliser votre commande directement ici avec paiement à la livraison à ${cart.city} !`;
    const url = whatsappLink(cart.customerPhone, msg);
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Récupération de Chiffre d'Affaires
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Commandes Abandonnées
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Clients ayant commencé à saisir le formulaire COD sans cliquer sur le bouton final.
          </p>
        </div>

        <Link
          href={`/app/${storeSlug}/commandes`}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour aux commandes</span>
        </Link>
      </div>

      {/* Bannière de potentiel de récupération */}
      <div className="rounded-[24px] border border-black/[0.08] bg-[#111111] text-[#FAF8F5] p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
            Potentiel à Récupérer
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {formatFcfa(totalLostRevenue)}
          </div>
          <p className="text-xs text-[#FAF8F5]/70">
            {carts.filter((c) => !c.recovered).length} paniers abandonnés ces dernières 48h. Un message WhatsApp permet de convertir 25% à 40% d'entre eux.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
            <input
              type="text"
              placeholder="Rechercher client, tél, ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-xl bg-white/10 text-white placeholder:text-[#FAF8F5]/50 border border-white/10 focus:outline-none w-full sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Liste des paniers abandonnés */}
      <div className="space-y-3">
        {filteredCarts.length === 0 ? (
          <div className="p-12 text-center rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] text-xs text-[#888880]">
            Aucun panier abandonné trouvé.
          </div>
        ) : (
          filteredCarts.map((cart) => (
            <div
              key={cart.id}
              className={cn(
                "rounded-[22px] border border-black/[0.08] p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all",
                cart.recovered ? "bg-emerald-50/50 border-emerald-200" : "bg-[#FAF8F5] hover:border-black/[0.15]"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-[#111111]">{cart.customerName}</span>
                  <span className="font-mono text-xs text-[#666660]">({cart.customerPhone})</span>
                  {cart.recovered ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Converti en commande
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      Non validé
                    </span>
                  )}
                </div>

                <p className="text-xs font-medium text-[#111111]">
                  {cart.productName} {cart.variant && `(${cart.variant})`}
                </p>

                <div className="text-[11px] text-[#888880] flex items-center gap-2 mt-0.5">
                  <span>Ville : {cart.city}</span>
                  <span>• Date : {cart.startedAt}</span>
                  <span className="font-bold text-amber-700">({cart.timeAgo})</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.06]">
                <div className="text-right sm:mr-2">
                  <span className="text-[10px] text-[#888880] block">Montant du panier</span>
                  <span className="font-black text-sm text-[#111111]">
                    {formatFcfa(cart.estimatedAmount)}
                  </span>
                </div>

                {!cart.recovered && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleContactWhatsApp(cart)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Contacter sur WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConvertToOrder(cart)}
                      className="px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-black text-[#FAF8F5] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span>Convertir en commande</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
