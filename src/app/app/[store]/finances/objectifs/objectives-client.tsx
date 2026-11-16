"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Target,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Calendar,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { RevenueGoal, GoalMetric, GoalPeriodType, GoalScope } from "@/server/data/goal-types";
import { MOCK_GOALS } from "@/mock-data/goals";
import { RevenueGoalCard } from "@/components/finance/revenue-goal-card";
import { cn } from "@/lib/utils";

interface ObjectivesClientProps {
  storeSlug: string;
}

export function ObjectivesClient({ storeSlug }: ObjectivesClientProps) {
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const [goals, setGoals] = useState<RevenueGoal[]>(MOCK_GOALS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Assistant de création (4 étapes)
  const [wizardStep, setWizardStep] = useState(1);
  const [newTitle, setNewTitle] = useState("Objectif Décembre 2026");
  const [newMetric, setNewMetric] = useState<GoalMetric>("collected_real");
  const [newPeriodType, setNewPeriodType] = useState<GoalPeriodType>("month");
  const [newScope, setNewScope] = useState<GoalScope>("store");
  const [newTargetAmount, setNewTargetAmount] = useState(5500000);
  const [newBonus, setNewBonus] = useState(150000);
  const [hasBonus, setHasBonus] = useState(true);

  const currentGoal = goals.find((g) => g.status === "active") || goals[0];
  const pastGoals = goals.filter((g) => g.status === "completed" || g.status === "expired");

  const handleCreateGoal = () => {
    const created: RevenueGoal = {
      id: `goal_${Date.now()}`,
      storeId: storeSlug,
      title: newTitle,
      metric: newMetric,
      periodType: newPeriodType,
      startDate: "2026-12-01",
      endDate: "2026-12-31",
      scope: newScope,
      targetAmount: newTargetAmount,
      currency: "FCFA",
      isLocked: hasBonus,
      hasBonus,
      status: "active",
      milestones: [
        { percentage: 75, targetAmount: Math.round(newTargetAmount * 0.75), label: "Palier 75%" },
        { percentage: 100, targetAmount: newTargetAmount, label: "Objectif 100%", bonusAmount: newBonus },
      ],
      progress: {
        confirmedCollected: 0,
        deliveredPending: 0,
        inTransitWeighted: 0,
        totalTarget: newTargetAmount,
        currentTotal: 0,
        percentAchieved: 0,
        projectedTotal: 0,
        projectedPercent: 0,
      },
      pace: {
        elapsedDays: 0,
        totalDays: 31,
        daysRemaining: 31,
        expectedPercentToday: 0,
        status: "on_track",
        statusLabel: "Démarre bientôt",
        remainingAmount: newTargetAmount,
        requiredDailyRate: Math.round(newTargetAmount / 31),
        currentDailyRate: 0,
      },
    };

    setGoals([created, ...goals]);
    setIsModalOpen(false);
    setWizardStep(1);
  };

  const formatAmount = (num: number) => num.toLocaleString("fr-FR").replace(/\s/g, "\u00A0");

  return (
    <div className="space-y-6">
      {/* En-tête de page avec fil d'Ariane et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="text-xs text-[#888880] mb-1">
            <span>Finances</span> › <span className="text-[#111111] font-bold">Objectifs de CA</span>
          </nav>
          <h1 className="text-2xl font-black text-[#0B1521] tracking-tight">
            Objectifs de chiffre d'affaires
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Suivi en temps réel de votre rentabilité et progression par rapport à vos cibles.
          </p>
        </div>

        <button
          type="button"
          id="btn-create-goal"
          onClick={() => {
            setWizardStep(1);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold bg-[#D35400] text-white hover:bg-[#B84700] transition-colors shadow-sm text-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvel objectif</span>
        </button>
      </div>

      {/* Onglets En cours / Historique */}
      <div className="flex border-b border-black/[0.08] gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("current")}
          className={cn(
            "pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer",
            activeTab === "current"
              ? "border-[#D35400] text-[#D35400]"
              : "border-transparent text-[#666660] hover:text-[#111111]"
          )}
        >
          Objectif en cours
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer",
            activeTab === "history"
              ? "border-[#D35400] text-[#D35400]"
              : "border-transparent text-[#666660] hover:text-[#111111]"
          )}
        >
          Historique des périodes ({pastGoals.length})
        </button>
      </div>

      {/* CONTENU ONGLET EN COURS */}
      {activeTab === "current" && (
        <div className="space-y-6">
          {/* Carte principale */}
          {currentGoal && (
            <RevenueGoalCard
              goal={currentGoal}
              basePath={`/app/${storeSlug}`}
              showDetailLink={false}
              className="p-6 border-black/[0.12] shadow-sm"
            />
          )}

          {/* Grille des paliers & primes associées */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#888880]">
              Paliers & Primes de l'objectif
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentGoal.milestones.map((ms, idx) => {
                const isReached = currentGoal.progress.percentAchieved >= ms.percentage;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-xl border flex flex-col justify-between",
                      isReached ? "bg-emerald-50/60 border-emerald-200" : "bg-[#FAF8F5] border-black/[0.06]"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-[#111111]">{ms.label}</span>
                        {isReached ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <span className="text-[10px] text-[#888880] font-bold">{ms.percentage}%</span>
                        )}
                      </div>
                      <p className="text-lg font-black font-mono text-[#0B1521]">
                        {formatAmount(ms.targetAmount)} {currentGoal.currency}
                      </p>
                    </div>
                    {ms.bonusAmount && (
                      <p className="text-[11px] text-emerald-800 font-bold mt-2 pt-2 border-t border-black/[0.06]">
                        Prime : +{formatAmount(ms.bonusAmount)} {currentGoal.currency}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET HISTORIQUE */}
      {activeTab === "history" && (
        <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-xs">
          <div className="p-4 border-b border-black/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111111]">Périodes clôturées</h3>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.1] text-xs font-bold hover:bg-black/[0.04]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Exporter CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-black/[0.06] text-[#888880] uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Période</th>
                  <th className="py-3 px-4">Cible</th>
                  <th className="py-3 px-4">Encaissé réel</th>
                  <th className="py-3 px-4">Atteinte</th>
                  <th className="py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {pastGoals.map((g) => (
                  <tr key={g.id} className="hover:bg-black/[0.02]">
                    <td className="py-3 px-4 font-bold text-[#111111]">{g.title}</td>
                    <td className="py-3 px-4 font-mono">{formatAmount(g.targetAmount)} {g.currency}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {formatAmount(g.progress.confirmedCollected)} {g.currency}
                    </td>
                    <td className="py-3 px-4 font-mono font-black">{g.progress.percentAchieved}%</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Atteint</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ASSISTANT DE CRÉATION EN 4 ÉTAPES (MODALE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-[520px] rounded-3xl bg-white border border-black/[0.1] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Haut de modale */}
            <div className="p-5 border-b border-black/[0.08] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <span className="text-[10px] font-bold text-[#D35400] uppercase tracking-wider">
                  Étape {wizardStep} sur 4
                </span>
                <h3 className="text-base font-black text-[#0B1521]">Créer un objectif de CA</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Étape 1 : Métrique & Période */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Intitulé de l'objectif
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-black/[0.12] text-xs bg-[#FAF8F5]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Métrique retenue
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewMetric("collected_real")}
                        className={cn(
                          "p-3 rounded-xl border text-left text-xs cursor-pointer",
                          newMetric === "collected_real"
                            ? "bg-[#0B1521] text-white border-[#0B1521] font-bold"
                            : "bg-[#FAF8F5] text-[#555550] border-black/[0.08]"
                        )}
                      >
                        <p className="font-bold">Encaissé réel (Recommandé)</p>
                        <p className="text-[10px] opacity-80 mt-0.5">Espèces en main en caisse</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewMetric("delivered_gross")}
                        className={cn(
                          "p-3 rounded-xl border text-left text-xs cursor-pointer",
                          newMetric === "delivered_gross"
                            ? "bg-[#0B1521] text-white border-[#0B1521] font-bold"
                            : "bg-[#FAF8F5] text-[#555550] border-black/[0.08]"
                        )}
                      >
                        <p className="font-bold">CA livré brut</p>
                        <p className="text-[10px] opacity-80 mt-0.5">Colis livrés par les livreurs</p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Étape 2 : Périmètre */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-[#111111] mb-1">
                    Périmètre d'application
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: "store", label: "Boutique entière (Lomé Glow)", desc: "Tous les produits et closeuses" },
                      { id: "closer", label: "Par Closeuse individuelle", desc: "Objectif personnel de closing" },
                      { id: "product", label: "Par Produit spécifique", desc: "Campagne dédiée sur un best-seller" },
                    ].map((s) => (
                      <div
                        key={s.id}
                        onClick={() => setNewScope(s.id as GoalScope)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer text-xs flex items-center justify-between",
                          newScope === s.id ? "bg-emerald-50/80 border-emerald-300" : "bg-[#FAF8F5] border-black/[0.08]"
                        )}
                      >
                        <div>
                          <p className="font-bold text-[#111111]">{s.label}</p>
                          <p className="text-[10px] text-[#666660]">{s.desc}</p>
                        </div>
                        {newScope === s.id && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Étape 3 : Cible & Paliers */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#111111] mb-1">
                      Montant cible (FCFA)
                    </label>
                    <input
                      type="number"
                      step={50000}
                      value={newTargetAmount}
                      onChange={(e) => setNewTargetAmount(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl border border-black/[0.12] text-sm font-mono font-bold bg-[#FAF8F5]"
                    />
                    <p className="text-[10px] text-[#888880] mt-1">
                      Suggestion automatique : moyenne 3 derniers mois + 15%
                    </p>
                  </div>

                  <div className="pt-2 border-t border-black/[0.06]">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#111111]">
                      <input
                        type="checkbox"
                        checked={hasBonus}
                        onChange={(e) => setHasBonus(e.target.checked)}
                        className="rounded text-[#D35400]"
                      />
                      <span>Associer une prime de performance</span>
                    </label>
                    {hasBonus && (
                      <input
                        type="number"
                        value={newBonus}
                        onChange={(e) => setNewBonus(Number(e.target.value))}
                        placeholder="Montant de la prime (ex: 150 000 FCFA)"
                        className="w-full h-10 px-3 mt-2 rounded-xl border border-black/[0.12] text-xs font-mono bg-[#FAF8F5]"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Étape 4 : Récapitulatif et validation */}
              {wizardStep === 4 && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-black/[0.08] space-y-1.5">
                    <p className="font-bold text-[#0B1521] text-sm">{newTitle}</p>
                    <p className="text-[#666660]">Cible : <strong className="font-mono text-[#111111]">{formatAmount(newTargetAmount)} FCFA</strong></p>
                    <p className="text-[#666660]">Métrique : {newMetric === "collected_real" ? "Encaissé réel" : "CA livré"}</p>
                    {hasBonus && <p className="text-emerald-700 font-bold">Prime : +{formatAmount(newBonus)} FCFA</p>}
                  </div>

                  {hasBonus && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Attention : un objectif avec prime est verrouillé dès le premier jour de la période pour éviter toute contestation.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pied de modale */}
            <div className="p-4 bg-[#FAF8F5] border-t border-black/[0.08] flex items-center justify-between">
              {wizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#666660] hover:text-[#111111]"
                >
                  Précédent
                </button>
              ) : (
                <div />
              )}

              {wizardStep < 4 ? (
                <button
                  type="button"
                  id="btn-wizard-next"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0B1521] text-white hover:bg-black transition-colors flex items-center gap-1.5"
                >
                  <span>Suivant</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-confirm-create-goal"
                  onClick={handleCreateGoal}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#D35400] text-white hover:bg-[#B84700] transition-colors shadow-sm"
                >
                  Activer l'objectif
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
