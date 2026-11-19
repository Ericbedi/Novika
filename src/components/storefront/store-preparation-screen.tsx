"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Settings, Plus, ShoppingBag } from "lucide-react";

interface StorePreparationScreenProps {
  storeName: string;
  storeSlug: string;
  isOwner?: boolean;
}

export function StorePreparationScreen({
  storeName,
  storeSlug,
  isOwner = false,
}: StorePreparationScreenProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center mx-auto shadow-2xs">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#888880] px-3 py-1 rounded-full bg-black/[0.04]">
            {storeName}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Cette boutique est en cours de préparation
          </h1>
          <p className="text-xs text-[#666660] leading-relaxed max-w-sm mx-auto">
            Le catalogue de produits et les options de livraison avec paiement en espèces sont en cours
            de configuration. Revenez très bientôt !
          </p>
        </div>

        {isOwner && (
          <div className="pt-4 p-5 rounded-2xl bg-white border border-black/[0.08] shadow-sm text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#111111]">
              <Settings className="w-4 h-4 text-amber-600" />
              <span>Espace Propriétaire — Liste de lancement :</span>
            </div>
            <ul className="text-[11px] text-[#666660] space-y-1.5 list-disc list-inside">
              <li>Ajouter au moins 1 produit publié</li>
              <li>Configurer votre numéro WhatsApp de service client</li>
              <li>Activer la publication dans votre tableau de bord</li>
            </ul>
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Link
                href={`/app/${storeSlug}/produits/nouveau`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un produit</span>
              </Link>
              <Link
                href={`/app/${storeSlug}`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 text-[#111111] text-xs font-bold hover:bg-stone-200 transition-colors"
              >
                <span>Tableau de bord</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
