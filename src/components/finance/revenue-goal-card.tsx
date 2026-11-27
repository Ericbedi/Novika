"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { RevenueGoal } from "@/server/data/goal-types";
import { cn } from "@/lib/utils";

export interface RevenueGoalCardProps {
  goal: RevenueGoal;
  basePath?: string;
  className?: string;
  showDetailLink?: boolean;
}

export function RevenueGoalCard({
  goal,
  basePath = "/app/lome-glow",
  className = "",
  showDetailLink = true,
}: RevenueGoalCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const { progress, pace, targetAmount, currency } = goal;

  const seg1Percent = Math.min((progress.confirmedCollected / targetAmount) * 100, 100);
  const seg2Percent = Math.min((progress.deliveredPending / targetAmount) * 100, 100 - seg1Percent);
  const seg3Percent = Math.min((progress.inTransitWeighted / targetAmount) * 100, 100 - seg1Percent - seg2Percent);

  const formatAmount = (num: number) => num.toLocaleString("fr-FR").replace(/\s/g, "\u00A0");

  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.08] bg-white p-4 sm:p-5 shadow-xs space-y-3.5 select-none transition-all",
        className
      )}
      id="revenue-goal-card"
    >
      {/* En-tête : Titre, Badge d'allure et Cible */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#0B1521] text-[#F26522] flex items-center justify-center shrink-0">
            <Target className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#111111]">{goal.title}</h3>
              {goal.isLocked && (
                <span
                  title="Objectif verrouillé car une prime y est attachée"
                  className="text-[10px] text-[#888880] flex items-center gap-0.5"
                >
                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  <span>Verrouillé</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#666660]">
              Métrique : {goal.metric === "collected_real" ? "Encaissé réel en caisse" : "CA livré brut"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Pastille d'état d'allure */}
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
              pace.status === "ahead"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : pace.status === "on_track"
                  ? "bg-black/[0.04] text-[#111111] border border-black/[0.08]"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
            )}
          >
            {pace.status === "ahead" && <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />}
            {pace.status === "behind" && <AlertCircle className="h-3.5 w-3.5 text-amber-600" />}
            <span>{pace.statusLabel}</span>
          </span>

          {showDetailLink && (
            <Link
              href={`${basePath}/finances/objectifs`}
              className="text-xs font-bold text-[#D35400] hover:underline flex items-center gap-0.5 ml-1"
            >
              <span>Détails</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Montants principaux */}
      <div className="flex items-baseline justify-between flex-wrap gap-2 pt-0.5">
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-2xl font-black text-[#0B1521]">
            {formatAmount(progress.confirmedCollected)}
          </span>
          <span className="text-xs font-bold text-[#666660]">
            / {formatAmount(targetAmount)} {currency}
          </span>
          <span className="text-sm font-black text-emerald-700 ml-1">
            ({progress.percentAchieved}%)
          </span>
        </div>

        <div className="text-xs text-[#666660] font-medium">
          <span>Reste à encaisser : </span>
          <strong className="text-[#111111] font-mono">{formatAmount(pace.remainingAmount)} {currency}</strong>
        </div>
      </div>

      {/* BARRE SEGMENTÉE (12px, rounded-full, 3 segments + Pace line) */}
      <div className="relative pt-1 pb-1">
        <div
          className="h-3 w-full rounded-full bg-black/[0.08] overflow-hidden flex relative"
          role="progressbar"
          aria-valuenow={progress.percentAchieved}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Segment 1 : Encaissé confirmé (Vert émeraude) */}
          <div
            style={{ width: `${seg1Percent}%` }}
            className="h-full bg-emerald-600 transition-all duration-300"
            title={`Encaissé confirmé : ${formatAmount(progress.confirmedCollected)} ${currency}`}
          />
          {/* Segment 2 : Livré non remis (Ambre) */}
          <div
            style={{ width: `${seg2Percent}%` }}
            className="h-full bg-amber-500 transition-all duration-300"
            title={`Livré en caisse livreur : ${formatAmount(progress.deliveredPending)} ${currency}`}
          />
          {/* Segment 3 : En cours pondéré (Bleu doux) */}
          <div
            style={{ width: `${seg3Percent}%` }}
            className="h-full bg-blue-400/80 transition-all duration-300"
            title={`En cours pondéré : ${formatAmount(progress.inTransitWeighted)} ${currency}`}
          />
        </div>

        {/* Repère d'allure (Pace line) montrant l'avancement théorique aujourd'hui */}
        <div
          style={{ left: `${Math.min(pace.expectedPercentToday, 100)}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-[#1F3A26] z-10 pointer-events-none"
          title={`Repère aujourd'hui : jour ${pace.elapsedDays}/${pace.totalDays} (${Math.round(pace.expectedPercentToday)}%)`}
        >
          <div className="w-2 h-2 -ml-[3px] -top-1 absolute bg-[#1F3A26] rounded-full" />
        </div>
      </div>

      {/* Légende des 3 segments */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#666660] gap-2 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
          <span>Encaissé réel : <strong className="font-mono text-[#111111]">{formatAmount(progress.confirmedCollected)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          <span>Livré en caisse livreur : <strong className="font-mono text-[#111111]">{formatAmount(progress.deliveredPending)}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
          <span>En cours pondéré : <strong className="font-mono text-[#111111]">{formatAmount(progress.inTransitWeighted)}</strong></span>
        </div>
      </div>

      {/* Ligne d'analyse d'allure et projection */}
      <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div>
          <span className="text-[#888880] block text-[10px] uppercase font-bold">Temps restant</span>
          <span className="font-bold text-[#111111] flex items-center gap-1 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-[#666660]" />
            <span>{pace.daysRemaining} jours restants</span>
          </span>
        </div>

        <div>
          <span className="text-[#888880] block text-[10px] uppercase font-bold">Rythme nécessaire</span>
          <span className="font-bold text-[#111111] mt-0.5 block font-mono">
            {formatAmount(pace.requiredDailyRate)} {currency} / j
          </span>
        </div>

        <div>
          <span className="text-[#888880] block text-[10px] uppercase font-bold">Projection fin de mois</span>
          <span className="font-bold text-emerald-800 mt-0.5 block font-mono">
            {formatAmount(progress.projectedTotal)} {currency} ({progress.projectedPercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}
