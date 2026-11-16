"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  PhoneCall,
  Bike,
  CheckCircle2,
  Banknote,
  Play,
  Pause,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoStep {
  id: number;
  stepNumber: string;
  name: string;
  role: string;
  actor: string;
  badgeColor: string;
  orderNumber: string;
  amount: string;
  location: string;
  description: string;
  technicalDetail: string;
  statusBadge: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    stepNumber: "1. Réception",
    name: "Commande client passée sur la boutique",
    role: "Acheteur",
    actor: "Client COD · Lomé",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    orderNumber: "#CMD-2026-LOM-042",
    amount: "35 000 FCFA",
    location: "Lomé, Quartier Totsi",
    description: "Le client remplit le formulaire épuré en 30 secondes. Aucune avance bancaire exigée. Les coordonnées WhatsApp sont vérifiées en direct.",
    technicalDetail: "Géolocalisation de zone automatique sans stocker les coordonnées GPS privées.",
    statusBadge: "À confirmer",
  },
  {
    id: 2,
    stepNumber: "2. Confirmation",
    name: "Appel & Validation par la closeuse",
    role: "Closeuse",
    actor: "Closeuse · Awa",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    orderNumber: "#CMD-2026-LOM-042",
    amount: "35 000 FCFA",
    location: "Lomé, Quartier Totsi",
    description: "Awa ouvre la fiche de commande, clique sur le lien WhatsApp préparé et confirme la disponibilité du client pour la livraison de cet après-midi.",
    technicalDetail: "La closeuse ne voit jamais le coût d'achat du produit ni la marge du propriétaire.",
    statusBadge: "Confirmée",
  },
  {
    id: 3,
    stepNumber: "3. Assignation",
    name: "Répartition intelligente au livreur",
    role: "Dispatch",
    actor: "Livreur · Koffi",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    orderNumber: "#CMD-2026-LOM-042",
    amount: "35 000 FCFA",
    location: "Lomé, Secteur Totsi & Tokoin",
    description: "L'algorithme de dispatch affecte le colis à Koffi, livreur en service le plus proche du secteur. Koffi reçoit la notification avec le point de repère précis.",
    technicalDetail: "Priorisation automatique des membres en service selon les horaires de travail configurés.",
    statusBadge: "En livraison",
  },
  {
    id: 4,
    stepNumber: "4. Livraison",
    name: "Remise du colis en main propre",
    role: "Livreur",
    actor: "Livreur · Koffi",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    orderNumber: "#CMD-2026-LOM-042",
    amount: "35 000 FCFA",
    location: "Chez le client · Lomé Totsi",
    description: "Koffi arrive sur place, fait vérifier le contenu du colis au client et procède à la remise.",
    technicalDetail: "Si le client est indisponible, Koffi planifie un report en 1 clic sans risque de perte du colis.",
    statusBadge: "Colis remis",
  },
  {
    id: 5,
    stepNumber: "5. Encaissement",
    name: "Paiement en espèces & Clôture",
    role: "Finances COD",
    actor: "Caisse & Reversement",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    orderNumber: "#CMD-2026-LOM-042",
    amount: "35 000 FCFA",
    location: "Espèces encaissées",
    description: "Le client règle 35 000 FCFA en espèces. Koffi valide le reçu dématérialisé. Les fonds sont ajoutés au livre de caisse à reverser.",
    technicalDetail: "Mise à jour en temps réel du stock, du P&L du marché et du taux de livraison.",
    statusBadge: "Livrée · Encaissé",
  },
];

export function InteractiveOrderDemo() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const step = DEMO_STEPS[currentStepIdx];

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIdx((prev) => (prev + 1) % DEMO_STEPS.length);
      }, 4000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleNext = () => {
    setCurrentStepIdx((prev) => (prev + 1) % DEMO_STEPS.length);
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
    setIsPlaying(false);
  };

  return (
    <section id="demo" className="py-16 sm:py-24 bg-[#FAF8F5] border-y border-black/[0.08]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111111] text-[#FAF8F5] text-[11px] font-bold mb-3 shadow-2xs">
            <Sparkles className="h-3 w-3 text-[#22C55E]" />
            <span>Démonstration — données d'exemple</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Le parcours complet d'une commande COD
          </h2>
          <p className="text-xs sm:text-sm text-[#666660] mt-2">
            Voyez comment une commande progresse en direct, de la validation du panier jusqu'à l'encaissement des espèces dans la poche du livreur.
          </p>
        </div>

        {/* Barre de navigation des 5 étapes */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-8">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setCurrentStepIdx(idx);
                setIsPlaying(false);
              }}
              className={cn(
                "p-2 sm:p-3 rounded-xl border text-left transition-all cursor-pointer",
                currentStepIdx === idx
                  ? "bg-white border-[#111111] shadow-xs"
                  : "bg-white/60 border-black/[0.06] hover:bg-white"
              )}
            >
              <span className="text-[10px] font-bold block text-[#888880] truncate">
                {s.stepNumber}
              </span>
              <span
                className={cn(
                  "text-[11px] font-black truncate block mt-0.5",
                  currentStepIdx === idx ? "text-[#111111]" : "text-[#666660]"
                )}
              >
                {s.role}
              </span>
            </button>
          ))}
        </div>

        {/* Carte interactive de la commande */}
        <div className="bg-white rounded-3xl border border-black/[0.08] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-black text-sm shrink-0">
                {step.id}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-[#111111]">
                    {step.name}
                  </h3>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold border", step.badgeColor)}>
                    {step.statusBadge}
                  </span>
                </div>
                <span className="text-xs text-[#888880]">
                  Acteur : <strong className="text-[#111111]">{step.actor}</strong>
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] text-[#888880] block font-mono">
                {step.orderNumber}
              </span>
              <span className="text-lg font-black text-[#111111]">
                {step.amount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <p className="text-xs sm:text-sm text-[#111111] leading-relaxed">
                {step.description}
              </p>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06] text-[11px] text-[#666660] flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#22C55E] shrink-0" />
                <span>
                  <strong>Sous le capot :</strong> {step.technicalDetail}
                </span>
              </div>
            </div>

            <div className="md:col-span-4 p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#888880]">Destination :</span>
                <span className="font-bold text-[#111111]">{step.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888880]">Mode de règlement :</span>
                <span className="font-bold text-[#16A34A]">Espèces à la livraison (COD)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888880]">Notification :</span>
                <span className="font-bold text-[#111111]">Son & WhatsApp immédiat</span>
              </div>
            </div>
          </div>

          {/* Contrôles interactifs */}
          <div className="pt-4 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="demo-play-pause-btn"
                onClick={() => setIsPlaying(!isPlaying)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-[#FAF8F5] text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-2xs"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPlaying ? "Pause" : "Lecture automatique"}</span>
              </button>

              <button
                type="button"
                id="demo-next-step-btn"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-black/[0.08] text-[#111111] text-xs font-bold hover:bg-black/[0.04] transition-all cursor-pointer shadow-2xs"
              >
                <span>Étape suivante</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                id="demo-reset-btn"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-black/[0.08] text-[#888880] text-xs font-bold hover:text-[#111111] transition-all cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Recommencer</span>
              </button>
            </div>

            <span className="text-[11px] text-[#888880]">
              Étape {step.id} sur 5
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
