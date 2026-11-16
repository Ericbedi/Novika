"use client";

import React from "react";
import {
  Sparkles,
  X,
  MessageSquarePlus,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface BetaInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFeedback: () => void;
}

export function BetaInfoModal({
  isOpen,
  onClose,
  onOpenFeedback,
}: BetaInfoModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="beta-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#FAF8F5] border border-black/10 p-6 shadow-2xl text-[#111111] space-y-4">
        {/* En-tête */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#C2410C] flex items-center justify-center font-black">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="beta-modal-title" className="text-base font-black tracking-tight">
                  Novika Bêta
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#C2410C] border border-orange-200">
                  v0.9.4
                </span>
              </div>
              <p className="text-xs text-[#666660]">Programme testeur privé d'Afrique de l'Ouest</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-xl text-[#888880] hover:text-[#111111] hover:bg-black/[0.04]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nouveautés de la version */}
        <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] space-y-2 text-xs">
          <span className="font-bold text-[#111111] block uppercase text-[10px] tracking-wider">
            Nouveautés de cette mise à jour :
          </span>
          <ul className="space-y-1.5 text-[11px] text-[#555550]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Suppression de la barre du haut :</strong> Navigation unifiée dans la barre latérale compacte (256 px).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Recherche universelle rapide :</strong> Raccourci Ctrl+K et recherche groupée commandes, clients et produits.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Livraison 100% Gratuite :</strong> Gestion des zones locales COD vs expéditions prépayées par transporteurs.
              </span>
            </li>
          </ul>
        </div>

        {/* Conditions de la Bêta */}
        <div className="p-3 rounded-xl bg-black/[0.03] text-[10px] text-[#666660] leading-relaxed">
          <ShieldCheck className="h-3 w-3 text-[#111111] inline mr-1" />
          En participant à la bêta privée, vos données commerciales réelles sont strictement cloisonnées par boutique avec isolation Row Level Security.
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/[0.08]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFeedback();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 bg-white text-xs font-bold text-[#111111] hover:bg-black/[0.04] transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Signaler un problème</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFeedback();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C2410C] text-white text-xs font-bold hover:bg-[#9A3412] transition-all shadow-xs"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" />
            <span>Donner mon avis</span>
          </button>
        </div>
      </div>
    </div>
  );
}
