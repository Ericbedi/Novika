"use client";

import React from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  TrendingUp,
  Package,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { CountryFlag } from "@/components/ui/country-flag";

/**
 * Aperçu visuel immersif du vrai produit Kelio pour le Hero de la landing page (Prompt 05-L).
 * - Entièrement conçu en HTML/CSS/SVG ultra-léger (0 image lourde, net sur Retina/4K, zéro CLS).
 * - Cadre bureau : Tableau de bord Kelio (liste de commandes COD avec les 4 familles de couleurs, objectif de CA encaissé, alerte cloche).
 * - Cadre mobile superposé : Page de suivi client par étapes en direct (Reçue → Confirmée → En route → Livrée).
 * - Mention discrète « Aperçu — données d'exemple », données anonymisées sans fausse preuve sociale.
 * - Flottement doux et balancement sobre de la cloche ; strictement désactivé si prefers-reduced-motion est actif.
 * - Décoratif pour les lecteurs d'écran (aria-hidden="true").
 */
export function HeroProductPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-[580px] lg:max-w-[620px] mx-auto select-none pointer-events-none"
    >
      <style>{`
        @keyframes hero-subtle-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes hero-phone-float {
          0%, 100% { transform: translateY(0px) rotate(1deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes hero-bell-swing {
          0% { transform: rotate(0deg); }
          20% { transform: rotate(15deg); }
          40% { transform: rotate(-12deg); }
          60% { transform: rotate(8deg); }
          80% { transform: rotate(-4deg); }
          100% { transform: rotate(0deg); }
        }
        .anim-hero-desktop {
          animation: hero-subtle-float 7s ease-in-out infinite;
        }
        .anim-hero-phone {
          animation: hero-phone-float 6s ease-in-out infinite;
        }
        .anim-bell-ring {
          animation: hero-bell-swing 1.8s ease-in-out 1 forwards;
          transform-origin: top center;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-hero-desktop,
          .anim-hero-phone,
          .anim-bell-ring {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Halo lumineux d'ambiance avec les teintes de la marque (Marine #0B1521, Orange #F26522, Or #F59E0B) */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-[#F26522]/15 via-[#0B1521]/5 to-[#F59E0B]/10 rounded-3xl blur-2xl -z-10" />

      {/* =========================================================================
          1. CADRE ORDINATEUR (Tableau de bord Kelio)
          ========================================================================= */}
      <div className="anim-hero-desktop rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 bg-white/95 dark:bg-[#0B1521]/95 shadow-2xl backdrop-blur-md overflow-hidden text-left transition-transform">
        {/* Barre de titre de fenêtre */}
        <div className="px-4 py-2.5 bg-[#FAF8F5] dark:bg-[#080F18] border-b border-black/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]/80 inline-block" />
          </div>
          <div className="px-3 py-0.5 rounded-md bg-black/[0.04] dark:bg-white/[0.06] text-[11px] font-mono font-medium text-[#888880] truncate max-w-[200px] sm:max-w-xs">
            app.novika.africa/lome-lux
          </div>
          <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            En ligne
          </div>
        </div>

        {/* Corps du tableau de bord */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Bandeau « Nouvelle commande » avec cloche animée */}
          <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-[#D35400]/10 via-[#F26522]/5 to-transparent border border-[#F26522]/25 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#D35400] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bell className="w-3.5 h-3.5 anim-bell-ring" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D35400] block leading-none">
                  Nouvelle commande reçue
                </span>
                <span className="text-xs font-bold text-[#111111] dark:text-white truncate block mt-0.5">
                  #CMD-003 · Abidjan · 24 900 FCFA
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#888880] shrink-0 bg-white dark:bg-black/40 px-2 py-0.5 rounded-md border border-black/[0.06]">
              À l&apos;instant
            </span>
          </div>

          {/* Carte « Objectif de CA encaissé » avec barre de progression multi-segments */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0E1B2A] border border-black/[0.06] dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#111111] dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#D35400]" />
                Objectif de CA encaissé
              </span>
              <span className="font-mono font-bold text-[#111111] dark:text-white text-[11px]">
                4 250 000 / 6 000 000 FCFA
              </span>
            </div>

            {/* Barre 3 segments : Encaissé réel (Vert), Livré en attente (Ambre), Confirmé (Bleu) */}
            <div className="w-full h-2.5 bg-black/[0.08] dark:bg-white/[0.1] rounded-full overflow-hidden flex">
              <div
                style={{ width: "52%" }}
                className="bg-emerald-500 h-full"
                title="Encaissé réel"
              />
              <div
                style={{ width: "14%" }}
                className="bg-amber-400 h-full"
                title="Livré en attente de versement"
              />
              <div
                style={{ width: "5%" }}
                className="bg-blue-500 h-full"
                title="Confirmé programmé"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#888880] pt-0.5">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Encaissé (52%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                En attente (14%)
              </span>
              <span className="font-semibold text-foreground">71% atteint</span>
            </div>
          </div>

          {/* Liste de commandes avec les 4 familles de couleurs du design */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#888880] px-1">
              Commandes récentes (Flux COD)
            </div>

            {/* 1. Ambre / Orange : En cours de livraison */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#0B1521] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <CountryFlag code="CI" width={20} height={14} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#111111] dark:text-white truncate">
                    CMD-003 · Client A.
                  </div>
                  <div className="text-[10px] text-[#888880] truncate">
                    Abidjan (Cocody) · Café Bio Vitality
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs font-bold text-[#111111] dark:text-white">
                  24 900 F
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                  En route
                </span>
              </div>
            </div>

            {/* 2. Vert : Livrée */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#0B1521] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <CountryFlag code="TG" width={20} height={14} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#111111] dark:text-white truncate">
                    CMD-002 · Client B.
                  </div>
                  <div className="text-[10px] text-[#888880] truncate">
                    Lomé (Agoè) · Sérum Anti-Taches
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs font-bold text-[#111111] dark:text-white">
                  31 500 F
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  Livrée
                </span>
              </div>
            </div>

            {/* 3. Bleu : Confirmée */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#0B1521] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <CountryFlag code="SN" width={20} height={14} className="shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#111111] dark:text-white truncate">
                    CMD-001 · Client C.
                  </div>
                  <div className="text-[10px] text-[#888880] truncate">
                    Dakar (Mermoz) · Pack Infusion
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs font-bold text-[#111111] dark:text-white">
                  19 500 F
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25">
                  Confirmée
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pied discret du cadre ordinateur */}
        <div className="px-4 py-2 bg-[#FAF8F5] dark:bg-[#080F18] border-t border-black/[0.06] flex items-center justify-between text-[10px] text-[#888880]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Synchronisation en direct (Realtime)
          </span>
          <span className="italic font-medium">Aperçu — données d&apos;exemple</span>
        </div>
      </div>

      {/* =========================================================================
          2. CADRE TÉLÉPHONE SUPERPOSÉ (Page de suivi client Prompt 05-T)
          ========================================================================= */}
      <div className="anim-hero-phone absolute -bottom-8 -right-3 sm:-bottom-10 sm:-right-6 w-[230px] sm:w-[260px] rounded-[28px] border-4 border-[#0B1521] bg-white dark:bg-[#0B1521] shadow-2xl overflow-hidden text-left z-20">
        {/* Encoche téléphone / Speaker */}
        <div className="bg-[#0B1521] pt-2 pb-1.5 flex justify-center items-center">
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Contenu du suivi client */}
        <div className="p-3 sm:p-3.5 space-y-2.5 bg-[#FAF8F5] dark:bg-[#0B1521] min-h-[260px]">
          {/* En-tête marque boutique */}
          <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
            <div>
              <span className="text-[9px] font-semibold tracking-wider text-[#888880] uppercase block">
                Suivi colis
              </span>
              <span className="text-xs font-black text-[#111111] dark:text-white">
                Lomé Lux
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#D35400] bg-[#F26522]/10 px-2 py-0.5 rounded-full">
              CMD-003
            </span>
          </div>

          {/* Frise des 4 étapes client */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                Reçue & validée
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                Confirmée par appel
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3.5 h-3.5 rounded-full bg-[#D35400] text-white flex items-center justify-center shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </div>
              <span className="text-[11px] font-bold text-[#D35400]">
                En route (Livreur assigné)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs opacity-50">
              <div className="w-3.5 h-3.5 rounded-full border border-black/30 shrink-0" />
              <span className="text-[11px] text-[#888880]">
                Livrée à domicile
              </span>
            </div>
          </div>

          {/* Bouton WhatsApp Boutique */}
          <div className="pt-2">
            <div className="w-full py-1.5 px-2.5 rounded-xl bg-[#25D366] text-white text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-xs">
              <MessageCircle className="w-3 h-3 fill-white" />
              <span>Contacter la boutique</span>
            </div>
          </div>
        </div>

        {/* Barre d'accueil inférieure du téléphone */}
        <div className="bg-[#FAF8F5] dark:bg-[#0B1521] pb-2 flex justify-center">
          <div className="w-16 h-1 bg-black/20 dark:bg-white/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}
