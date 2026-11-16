"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  X,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Store,
  Palette,
  Phone,
  Globe2,
  Check,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  calculateOnboardingProgress,
  canPublishStorefront,
  MOCK_STOREFRONT_LOME,
} from "@/mock-data/storefront-data";
import { StorefrontData } from "@/server/data/storefront-types";
import { MOCK_PRODUCTS } from "@/mock-data/products";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { useApp } from "@/components/layout/app-shell";

interface OnboardingCardProps {
  storeSlug: string;
}

export function OnboardingCard({ storeSlug }: OnboardingCardProps) {
  const { activeStore } = useApp();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [storefrontState, setStorefrontState] = useState<StorefrontData>({
    ...MOCK_STOREFRONT_LOME,
    isPublished: false,
    customDomain: undefined,
  });
  const [passedOptionalDomain, setPassedOptionalDomain] = useState(false);
  const [hasTestedOrder, setHasTestedOrder] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  // Charger l'état masqué depuis le localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(`afribuilder_onboarding_dismissed_${storeSlug}`);
      if (dismissed === "true") {
        setIsDismissed(true);
      }
      const passed = localStorage.getItem(`afribuilder_onboarding_passed_domain_${storeSlug}`);
      if (passed === "true") {
        setPassedOptionalDomain(true);
      }
    }
  }, [storeSlug]);

  // Calcul dynamique de progression à partir des données réelles
  const progress = calculateOnboardingProgress(
    activeStore,
    MOCK_PRODUCTS,
    hasTestedOrder ? [...MOCK_ORDERS, { id: "test_order" } as any] : MOCK_ORDERS,
    storefrontState,
    passedOptionalDomain
  );

  const publishCheck = canPublishStorefront(activeStore, MOCK_PRODUCTS, storefrontState);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`afribuilder_onboarding_dismissed_${storeSlug}`, "true");
    }
  };

  const handleReopen = () => {
    setIsDismissed(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`afribuilder_onboarding_dismissed_${storeSlug}`);
    }
  };

  const handlePassDomain = () => {
    setPassedOptionalDomain(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(`afribuilder_onboarding_passed_domain_${storeSlug}`, "true");
    }
  };

  const handleTestOrder = () => {
    setHasTestedOrder(true);
    setPublishFeedback("Commande test simulée avec succès ! Vous pouvez maintenant publier votre boutique.");
    setTimeout(() => setPublishFeedback(null), 4000);
  };

  const handlePublishStore = () => {
    if (!publishCheck.allowed) {
      setPublishFeedback(`Publication impossible : ${publishCheck.missingRequirements.join(" ")}`);
      return;
    }
    setStorefrontState((prev) => ({
      ...prev,
      isPublished: true,
      publishedAt: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));
    setPublishFeedback("Félicitations ! Votre boutique en ligne est maintenant officiellement publiée et active.");
    setTimeout(() => setPublishFeedback(null), 5000);
  };

  // Si l'onboarding est terminé à 100%, la carte disparaît automatiquement
  if (progress.isAllCompleted) {
    return null;
  }

  // Si la carte a été masquée par le commerçant : bouton discret pour la rouvrir
  if (isDismissed) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center font-bold text-xs">
            {progress.percent}%
          </div>
          <div>
            <p className="text-xs font-bold text-[#111111]">Configuration de la boutique en cours</p>
            <p className="text-[10px] text-[#666660]">
              {progress.completedCount} sur {progress.totalCount} étapes terminées ({progress.percent}%)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleReopen}
          className="px-3 py-1.5 rounded-xl border border-black/15 bg-white text-xs font-bold text-[#111111] hover:bg-black/5 transition-all cursor-pointer shadow-2xs"
        >
          Reprendre l'assistant
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-black/10 bg-[#FAF8F5] p-5 sm:p-7 shadow-xs overflow-hidden space-y-5 transition-all">
      {/* Feedback Toast */}
      {publishFeedback && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{publishFeedback}</span>
        </div>
      )}

      {/* En-tête : Titre, Sous-titre & Bouton Fermer */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
              Guide d'installation
            </span>
            <span className="text-xs font-bold text-[#666660]">
              {progress.completedCount} sur {progress.totalCount} terminées
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
            Pour commencer
          </h2>
          <p className="text-xs text-[#666660]">
            Complétez ces étapes pour configurer votre boutique et lancer vos ventes en paiement à la livraison.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Réduire" : "Déplier"}
            className="p-2 rounded-xl text-[#666660] hover:text-[#111111] hover:bg-black/5 transition-all cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            title="Masquer l'assistant"
            className="p-2 rounded-xl text-[#666660] hover:text-[#111111] hover:bg-black/5 transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Barre de Progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-[#111111]">Progression globale</span>
          <span className="text-emerald-700">{progress.percent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </div>

      {/* Liste des 7 Étapes */}
      {isExpanded && (
        <div className="divide-y divide-black/[0.06] border-y border-black/[0.06] pt-1">
          {progress.steps.map((st) => (
            <div
              key={st.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0">
                  {st.isCompleted ? (
                    <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-black/25 text-[#666660] flex items-center justify-center text-[11px] font-bold">
                      {st.id}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-xs font-bold ${
                        st.isCompleted ? "text-[#444440]" : "text-[#111111]"
                      }`}
                    >
                      {st.title}
                    </h3>
                    {st.isOptional && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] bg-black/[0.05] px-2 py-0.5 rounded-full">
                        Optionnel
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#666660] mt-0.5">{st.subtitle}</p>
                </div>
              </div>

              {/* Boutons d'Action selon l'étape */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {st.key === "custom_domain" && !st.isCompleted && (
                  <button
                    type="button"
                    onClick={handlePassDomain}
                    className="px-3 py-1.5 rounded-xl border border-black/15 bg-white text-xs font-bold text-[#666660] hover:text-[#111111] hover:bg-black/5 transition-all cursor-pointer shadow-2xs"
                  >
                    Passer
                  </button>
                )}

                {st.key === "test_order_publish" ? (
                  <div className="flex items-center gap-2">
                    {!hasTestedOrder && (
                      <button
                        type="button"
                        onClick={handleTestOrder}
                        className="px-3 py-1.5 rounded-xl border border-black/15 bg-white text-xs font-bold text-[#111111] hover:bg-black/5 transition-all cursor-pointer shadow-2xs"
                      >
                        Simuler commande test
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handlePublishStore}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                        st.isCompleted
                          ? "bg-emerald-700 text-white hover:bg-emerald-800"
                          : "bg-[#111111] text-[#FAF8F5] hover:bg-black"
                      }`}
                    >
                      {st.isCompleted ? "Boutique Publiée ✓" : "Publier la boutique"}
                    </button>
                  </div>
                ) : (
                  <Link
                    href={st.actionUrl}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                      st.isCompleted
                        ? "border border-black/[0.08] bg-white text-[#666660] hover:text-[#111111] hover:bg-[#FAF8F5]"
                        : "bg-[#111111] text-[#FAF8F5] hover:bg-black"
                    }`}
                  >
                    <span>{st.actionLabel}</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conditions de publication rappelées */}
      {!publishCheck.allowed && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Conditions requises avant publication publique :</span>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
              {publishCheck.missingRequirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
