"use client";

import React, { useState } from "react";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Zap,
  Users,
  Store,
  Sparkles,
  PackageCheck,
  AlertTriangle,
  ArrowRight,
  Check,
  Building2,
  Lock,
  Smartphone,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MOCK_BILLING_PLANS, MOCK_STORE_USAGE } from "@/mock-data/vague1-data";
import { PlanBillingTier } from "@/server/data/vague1-types";
import { Money } from "@/components/app/money";
import { cn } from "@/lib/utils";

interface BillingClientProps {
  storeSlug: string;
}

export function BillingClient({ storeSlug }: BillingClientProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<PlanBillingTier | null>(null);
  const [mobileMoneyOperator, setMobileMoneyOperator] = useState<"wave" | "orange" | "mtn" | "moov">("wave");
  const [paymentPhone, setPaymentPhone] = useState("+228 90 12 34 56");
  const [isPaying, setIsPaying] = useState(false);
  const [activePlanId, setActivePlanId] = useState<string>("usage");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaying(true);

    setTimeout(() => {
      setIsPaying(false);
      if (selectedPlanForUpgrade) {
        setActivePlanId(selectedPlanForUpgrade.id);
        showToast(`Abonnement ${selectedPlanForUpgrade.name} activé avec succès via ${mobileMoneyOperator.toUpperCase()} !`);
      }
      setSelectedPlanForUpgrade(null);
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête */}
      <ScrollReveal delay={0}>
        <PageHeader
          title="Facturation, Offres & Quotas"
          description="Facturation transparente calculée sur les commandes réellement livrées. Ne payez jamais pour les faux numéros."
          badge={
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#111111] border border-black/[0.08] shadow-2xs">
              <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />
              Facturation sur commandes livrées
            </span>
          }
        />
      </ScrollReveal>

      {/* Bannière Règle d'or AfriBuilder (K6) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900 to-[#111111] text-[#FAF8F5] shadow-lg space-y-2 border border-emerald-500/20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-300">
            Principe fondamental de facturation COD
          </h2>
        </div>
        <p className="text-xs text-[#FAF8F5]/90 leading-relaxed font-sans">
          &laquo; Vous êtes facturé <strong>uniquement sur les commandes LIVRÉES</strong>, jamais sur les commandes reçues. Les commandes rejetées, les faux numéros ou les clients injoignables ne vous coûtent rien. Votre trésorerie est protégée. &raquo;
        </p>
      </div>

      {/* JAUGE D'USAGE & COMPTEURS ACTUELS (K6) */}
      <div className="rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#666660]">Formule actuelle :</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                {activePlanId === "usage" ? "Formule à l'Usage (20 offertes)" : activePlanId.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-[#888880] mt-0.5">
              Cycle de facturation en cours : 1er nov. 2026 – 30 nov. 2026
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-[#888880] uppercase">Facture estimée à ce jour</span>
            <div className="text-xl font-black text-[#111111]">
              <Money value={MOCK_STORE_USAGE.currentCycleInvoiceAmount} currency="XOF" />
            </div>
          </div>
        </div>

        {/* Grille des compteurs d'usage réels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Compteur 1 : Commandes Livrées */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
              <span className="flex items-center gap-1.5">
                <PackageCheck className="h-4 w-4 text-emerald-600" />
                Commandes livrées
              </span>
              <span className="font-mono text-emerald-700">
                {MOCK_STORE_USAGE.deliveredOrdersCount} / 20
              </span>
            </div>
            {/* Barre de progression */}
            <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${(MOCK_STORE_USAGE.deliveredOrdersCount / 20) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#888880]">
              {MOCK_STORE_USAGE.freeOrdersRemaining} livraison(s) offerte(s) restante(s). ({MOCK_STORE_USAGE.receivedOrdersCount} reçues, 0 FCFA facturé sur les rejets).
            </p>
          </div>

          {/* Compteur 2 : Membres de l'équipe */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-600" />
                Membres actifs
              </span>
              <span className="font-mono text-[#111111]">
                {MOCK_STORE_USAGE.membersCount} / {MOCK_STORE_USAGE.membersLimit}
              </span>
            </div>
            <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(MOCK_STORE_USAGE.membersCount / MOCK_STORE_USAGE.membersLimit) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#888880]">
              Closeuses & livreurs avec permissions RLS strictes.
            </p>
          </div>

          {/* Compteur 3 : Boutiques COD */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
              <span className="flex items-center gap-1.5">
                <Store className="h-4 w-4 text-purple-600" />
                Boutiques
              </span>
              <span className="font-mono text-[#111111]">
                {MOCK_STORE_USAGE.storesCount} / {MOCK_STORE_USAGE.storesLimit}
              </span>
            </div>
            <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${(MOCK_STORE_USAGE.storesCount / MOCK_STORE_USAGE.storesLimit) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#888880]">
              Lomé Glow (Togo & CI). Formule multi-boutique disponible.
            </p>
          </div>

          {/* Compteur 4 : Crédits IA */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Crédits IA
              </span>
              <span className="font-mono text-[#111111]">
                {MOCK_STORE_USAGE.aiCreditsUsed} / {MOCK_STORE_USAGE.aiCreditsLimit}
              </span>
            </div>
            <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${(MOCK_STORE_USAGE.aiCreditsUsed / MOCK_STORE_USAGE.aiCreditsLimit) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-[#888880]">
              Commande rapide, visuels et relances automatiques.
            </p>
          </div>
        </div>
      </div>

      {/* SÉLECTEUR CYCLE : MENSUEL / ANNUEL (-20%) */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <div className="inline-flex items-center p-1 rounded-2xl bg-[#FAF8F5] border border-black/[0.08] shadow-2xs">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              billingCycle === "monthly"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            Facturation Mensuelle
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              billingCycle === "yearly"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            <span>Facturation Annuelle</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-500 text-white">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* GRILLE DES FORMULES (K6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_BILLING_PLANS.map((plan) => {
          const isCurrent = activePlanId === plan.id;
          const price = billingCycle === "yearly" ? plan.priceYearlyDiscounted : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-3xl p-6 border transition-all flex flex-col justify-between relative",
                plan.isPopular
                  ? "border-[#111111] bg-white shadow-xl ring-2 ring-black/[0.08]"
                  : "border-black/[0.08] bg-[#FAF8F5] hover:border-black/20"
              )}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#111111] text-[#FAF8F5] shadow-sm">
                  Recommandé Volume
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-black text-[#111111]">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#111111]">
                      {price === 0 ? "0 FCFA" : `${price.toLocaleString("fr-FR")} ${plan.currency}`}
                    </span>
                    <span className="text-xs text-[#888880]">/mois</span>
                  </div>
                  {plan.id === "usage" ? (
                    <p className="text-[11px] text-emerald-700 font-bold mt-1">
                      20 premières livraisons offertes, puis 150 FCFA/livraison
                    </p>
                  ) : (
                    <p className="text-[11px] text-[#666660] mt-1">
                      {plan.deliveredOrdersIncluded} livraisons incluses ({plan.overageFeePerDelivered} FCFA sup.)
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-black/[0.06] space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#888880]">Inclus :</span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#333333]">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => setSelectedPlanForUpgrade(plan)}
                  className={cn(
                    "w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer",
                    isCurrent
                      ? "bg-black/5 text-[#888880] cursor-default border border-black/[0.06]"
                      : plan.isPopular
                      ? "bg-[#111111] text-[#FAF8F5] hover:bg-black"
                      : "bg-white text-[#111111] border border-black/[0.1] hover:bg-[#FAF8F5]"
                  )}
                >
                  {isCurrent ? "Formule Active" : "Choisir cette formule"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALE DE PAIEMENT SÉCURISÉ MOBILE MONEY (K6) */}
      {selectedPlanForUpgrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <div>
                <h3 className="text-base font-black text-[#111111]">Souscrire à {selectedPlanForUpgrade.name}</h3>
                <p className="text-xs text-[#666660]">Paiement sécurisé via agrégateur agréé</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForUpgrade(null)}
                className="p-1.5 text-[#666660] hover:text-[#111111]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-4">
              {/* Choix de l'opérateur Mobile Money */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-2">
                  Sélectionnez votre moyen de paiement :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "wave", label: "Wave", desc: "Sénégal, CI, etc." },
                    { id: "orange", label: "Orange Money", desc: "CI, Sénégal, Mali" },
                    { id: "mtn", label: "MTN MoMo", desc: "CI, Bénin, Cameroun" },
                    { id: "moov", label: "Moov Money", desc: "Togo, Bénin, CI" },
                  ].map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setMobileMoneyOperator(op.id as any)}
                      className={cn(
                        "p-3 rounded-2xl border text-left transition-all cursor-pointer",
                        mobileMoneyOperator === op.id
                          ? "border-[#111111] bg-white shadow-2xs font-bold"
                          : "border-black/[0.08] bg-white/60 hover:bg-white text-[#666660]"
                      )}
                    >
                      <p className="text-xs font-black text-[#111111]">{op.label}</p>
                      <p className="text-[10px] text-[#888880] mt-0.5">{op.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Numéro de téléphone Mobile Money */}
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">
                  Numéro de compte Mobile Money :
                </label>
                <input
                  type="text"
                  required
                  value={paymentPhone}
                  onChange={(e) => setPaymentPhone(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-black/[0.08] bg-white text-[#111111] font-bold focus:outline-none"
                />
              </div>

              {/* Récapitulatif montant */}
              <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-between text-xs">
                <span className="font-bold text-[#111111]">Montant à débiter :</span>
                <span className="text-base font-black text-[#111111]">
                  <Money
                    value={
                      billingCycle === "yearly"
                        ? selectedPlanForUpgrade.priceYearlyDiscounted * 12
                        : selectedPlanForUpgrade.priceMonthly
                    }
                    currency={selectedPlanForUpgrade.currency}
                  />
                  {billingCycle === "yearly" && (
                    <span className="text-[10px] font-normal text-[#888880] ml-1">(1 an)</span>
                  )}
                </span>
              </div>

              {/* Sécurité PCI-DSS et prestataire agréé */}
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Sécurité garantie :</strong> AfriBuilder ne stocke aucune coordonnée bancaire. Transaction chiffrée de bout en bout avec confirmation instantanée par l&apos;opérateur.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setSelectedPlanForUpgrade(null)}
                  className="px-4 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#666660] hover:text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="px-5 py-2.5 rounded-xl bg-[#111111] text-xs font-bold text-[#FAF8F5] hover:bg-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isPaying ? (
                    <span>Validation en cours...</span>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4" />
                      <span>Confirmer le paiement Mobile Money</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
