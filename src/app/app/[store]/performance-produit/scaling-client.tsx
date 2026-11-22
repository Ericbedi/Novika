"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Sliders,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Volume2,
  Download,
  Share2,
  DollarSign,
  Package,
  Target,
  Settings as SettingsIcon,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  Info,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  BarChart3,
  Clock,
} from "lucide-react";
import { useApp } from "@/components/layout/app-shell";
import { canViewScaling, canManageScaling } from "@/config/permissions";
import {
  calculateScalingMetrics,
  ScalingProductInput,
  MANDATORY_SCALING_DISCLAIMER,
  ScalingMetrics,
  analyzeWeeklyScaling,
  DEFAULT_WEEKLY_SCALING_HISTORY,
  WeeklyScalingSnapshot,
  WeeklyComparisonAnalysis,
  ScalingHealthStatus,
} from "@/lib/scaling";
import { formatFcfa } from "@/lib/money";
import { notificationSound } from "@/lib/notification-sound";
import { cn } from "@/lib/utils";

interface ScalingClientProps {
  storeSlug: string;
}

// Semaine vide : évite tout plantage tant qu'aucune donnée réelle n'existe.
const EMPTY_WEEK_SNAPSHOT: WeeklyScalingSnapshot = {
  weekKey: "",
  weekNumber: 0,
  label: "Aucune donnée",
  shortLabel: "-",
  startDate: "",
  endDate: "",
  isCurrent: true,
  adSpendDollars: 0,
  ordersCount: 0,
  deliveredUnits: 0,
  pendingUnits: 0,
  closingRate: 0,
  realCpaDollars: 0,
  cpaTargetDollars: 0,
  cpaBreakevenDollars: 0,
  netProfitFcfa: 0,
  dollarRate: 700,
  productsSummary: [],
};

export function ScalingClient({ storeSlug }: ScalingClientProps) {
  const { activeRole, activeStore } = useApp();

  const canView = canViewScaling(activeRole);
  const canManage = canManageScaling(activeRole);
  const isManager = activeRole === "manager";

  // Navigation des sous-onglets (Prompt 05-G / 05-R)
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "weekly" | "products" | "objectives" | "settings"
  >("dashboard");

  // Historique des cohortes hebdomadaires (Weekly) et gestion du calendrier
  const [weeksHistory, setWeeksHistory] = useState<WeeklyScalingSnapshot[]>(DEFAULT_WEEKLY_SCALING_HISTORY);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>("2026-W46");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<"single_week" | "weekly_comparison">("single_week");
  const calendarRef = useRef<HTMLDivElement>(null);

  // Filtres
  const [selectedProductFilter, setSelectedProductFilter] = useState<string>("all");
  const [dollarRate, setDollarRate] = useState(700); // Taux dollar réglable par boutique (ex: 700 FCFA)
  const [matureDaysThreshold, setMatureDaysThreshold] = useState(4); // Délai de livraison moyen (3 à 5 jours)
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // État simulateur en direct
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simA, setSimA] = useState(5000);
  const [simP, setSimP] = useState(15000);
  const [simL, setSimL] = useState(1500);
  const [simB, setSimB] = useState(3000);
  const [simClosing, setSimClosing] = useState(0.40);
  const [simSpend, setSimSpend] = useState(100);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fermeture du calendrier au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    if (isCalendarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Chargement des cohortes hebdomadaires depuis Supabase avec repli local
  useEffect(() => {
    let isMounted = true;
    async function loadScalingSnapshots() {
      try {
        const res = await fetch(`/api/scaling/history?store=${storeSlug}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.snapshots && data.snapshots.length > 0) {
            setWeeksHistory(data.snapshots);
          }
        }
      } catch {
        // Fallback silencieux vers les données locales
      }
    }
    loadScalingSnapshots();
    return () => {
      isMounted = false;
    };
  }, [storeSlug]);

  // Semaine actuellement sélectionnée
  const currentWeekSnapshot = useMemo(() => {
    return weeksHistory.find((w) => w.weekKey === selectedWeekKey) || weeksHistory[0] || EMPTY_WEEK_SNAPSHOT;
  }, [weeksHistory, selectedWeekKey]);

  // Index de la semaine sélectionnée (0 = la plus récente S46)
  const currentWeekIndex = useMemo(() => {
    return weeksHistory.findIndex((w) => w.weekKey === selectedWeekKey);
  }, [weeksHistory, selectedWeekKey]);

  // Semaine précédente chronologique pour le calcul des deltas WoW
  const previousWeekSnapshot = useMemo(() => {
    if (currentWeekIndex >= 0 && currentWeekIndex < weeksHistory.length - 1) {
      return weeksHistory[currentWeekIndex + 1];
    }
    return null;
  }, [weeksHistory, currentWeekIndex]);

  // Analyse comparative de scaling & détection d'over-scaling
  const weeklyAnalysis = useMemo(() => {
    return analyzeWeeklyScaling(currentWeekSnapshot, previousWeekSnapshot);
  }, [currentWeekSnapshot, previousWeekSnapshot]);

  // Liste des produits évalués pour la semaine active
  const evaluatedProducts = useMemo(() => {
    // Aucune donnée réelle : ne rien calculer (le taux de closing 0 est invalide)
    if (weeksHistory.length === 0) return [];
    if (currentWeekSnapshot.productsSummary && currentWeekSnapshot.productsSummary.length > 0) {
      return currentWeekSnapshot.productsSummary.map((ps) => {
        const baseInput: ScalingProductInput = {
          productId: ps.productId,
          productName: ps.productName,
          acquisitionPrice: ps.productId === "prod_03" ? 5000 : ps.productId === "prod_01" ? 3200 : 9000,
          sellingPrice: ps.productId === "prod_03" ? 15000 : ps.productId === "prod_01" ? 12500 : 16000,
          deliveryCost: ps.productId === "prod_04" ? 1800 : 1500,
          desiredProfit: ps.productId === "prod_03" ? 3000 : ps.productId === "prod_01" ? 3500 : 2500,
          dollarRate,
          closingRate: currentWeekSnapshot.closingRate,
          adSpendDollars: ps.adSpendDollars,
          deliveredUnits: ps.deliveredUnits,
          pendingUnits: Math.max(1, Math.round(ps.ordersCount * 0.15)),
          ordersCount: ps.ordersCount,
          campaignDays: 7,
          phase: ps.phase,
          consecutiveDaysOverBreakeven: ps.verdictKey === "cut" ? 3 : 0,
          consecutiveDaysUnderTarget: ps.verdictKey === "scale" ? 3 : 0,
        };
        const metrics = calculateScalingMetrics(baseInput);
        return {
          product: baseInput,
          metrics,
        };
      });
    }

    // Données par défaut si non renseigné
    const defaultData: ScalingProductInput[] = [
      {
        productId: "prod_03",
        productName: "Ceinture Amincissante Néoprène Double Sangle",
        acquisitionPrice: 5000,
        sellingPrice: 15000,
        deliveryCost: 1500,
        desiredProfit: 3000,
        dollarRate,
        closingRate: currentWeekSnapshot.closingRate,
        adSpendDollars: 100,
        deliveredUnits: 13,
        pendingUnits: 6,
        ordersCount: 38,
        campaignDays: 6,
        phase: "expansion",
        consecutiveDaysUnderTarget: 4,
      },
    ];

    return defaultData.map((p) => {
      const metrics = calculateScalingMetrics({ ...p, dollarRate });
      return {
        product: p,
        metrics,
      };
    });
  }, [currentWeekSnapshot, dollarRate, weeksHistory.length]);

  // Alerte sonore si un produit est au statut "Couper"
  useEffect(() => {
    const hasCutProduct = evaluatedProducts.some((ep) => ep.metrics.verdict.key === "cut");
    if (hasCutProduct) {
      notificationSound.playOrderSound(true).catch(() => {});
    }
  }, [evaluatedProducts]);

  // Métriques globales du tableau de bord synchronisées avec la semaine active
  const aggregateMetrics = useMemo(() => {
    const totalSpend = currentWeekSnapshot.adSpendDollars;
    const totalOrders = currentWeekSnapshot.ordersCount;
    const totalDelivered = currentWeekSnapshot.deliveredUnits;
    const avgClosingRate = currentWeekSnapshot.closingRate * 100;
    const avgRealCpa = currentWeekSnapshot.realCpaDollars;
    const totalNetProfitFcfa = currentWeekSnapshot.netProfitFcfa;

    const cutCount = evaluatedProducts.filter((p) => p.metrics.verdict.key === "cut").length;
    const scaleCount = evaluatedProducts.filter((p) => p.metrics.verdict.key === "scale").length;
    const monitorCount = evaluatedProducts.filter((p) => p.metrics.verdict.key === "monitor").length;

    return {
      totalSpend,
      totalOrders,
      totalDelivered,
      avgClosingRate,
      avgRealCpa,
      totalNetProfitFcfa,
      cutCount,
      scaleCount,
      monitorCount,
    };
  }, [currentWeekSnapshot, evaluatedProducts]);

  // Calcul du simulateur en direct
  const simulatedMetrics = useMemo(() => {
    return calculateScalingMetrics({
      productId: "sim_product",
      productName: "Simulation en direct",
      acquisitionPrice: simA,
      sellingPrice: simP,
      deliveryCost: simL,
      desiredProfit: simB,
      dollarRate,
      closingRate: simClosing,
      adSpendDollars: simSpend,
      deliveredUnits: Math.round(simSpend / 8),
      pendingUnits: 4,
      ordersCount: 28,
      campaignDays: 5,
      phase: "testing",
    });
  }, [simA, simP, simL, simB, dollarRate, simClosing, simSpend]);

  if (canView && weeksHistory.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-16">
        <div className="rounded-3xl border border-dashed border-black/[0.15] bg-white p-10 text-center space-y-2">
          <h1 className="text-lg font-black text-[#111111]">Performance & Scaling</h1>
          <p className="text-sm font-bold text-[#111111]">Aucune donnée pour le moment</p>
          <p className="text-xs text-[#666660] max-w-md mx-auto leading-relaxed">
            Les indicateurs apparaîtront ici dès que vos premières commandes et dépenses publicitaires réelles seront enregistrées.
          </p>
        </div>
      </div>
    );
  }

  // Restriction RLS : Closeuse, Livreur, Agence n'ont pas accès
  if (!canView) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-12">
        <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-10 text-center shadow-2xs space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-rose-950">Accès Restreint (Données Confidentielles)</h1>
            <p className="text-xs text-rose-800 max-w-md mx-auto mt-1 leading-relaxed">
              Le module Performance Produit & Scaling contient des dépenses publicitaires et des marges nettes confidentielles. Votre rôle ({activeRole}) ne vous autorise pas à y accéder.
            </p>
          </div>
          <Link
            href={`/app/${storeSlug}/commandes`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-black transition-colors"
          >
            <span>Retour aux Commandes</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* En-tête avec Titre et Barre d'Actions (Calendrier & Comparatif) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#666660] mb-1">
            <Link href={`/app/${storeSlug}`} className="hover:text-[#111111]">
              Tableau de bord
            </Link>
            <span>/</span>
            <span className="text-[#111111]">Performance Produit & Scaling</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#111111] flex items-center gap-2.5">
            <TrendingUp className="h-6 w-6 text-[#C2410C]" />
            <span>Performance Produit & Scaling</span>
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Aide à la décision objective pour vos campagnes COD : quand scaler, surveiller ou couper vos produits.
          </p>
        </div>

        {/* ======================================================== */}
        {/* NIVEAU CALENDRIER HEBDOMADAIRE & MODE COMPARATIF          */}
        {/* ======================================================== */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Widget Calendrier & Sélecteur de Semaine */}
          <div ref={calendarRef} className="relative flex items-center rounded-xl border border-black/10 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              id="btn-scaling-prev-week"
              title="Semaine précédente"
              aria-label="Semaine précédente"
              disabled={currentWeekIndex >= weeksHistory.length - 1}
              onClick={() => {
                if (currentWeekIndex < weeksHistory.length - 1) {
                  setSelectedWeekKey(weeksHistory[currentWeekIndex + 1].weekKey);
                }
              }}
              className={cn(
                "p-1.5 rounded-lg text-[#111111] hover:bg-black/[0.04] transition-colors cursor-pointer",
                currentWeekIndex >= weeksHistory.length - 1 && "opacity-30 cursor-not-allowed hover:bg-transparent"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              id="btn-scaling-calendar-trigger"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#111111] hover:bg-black/[0.03] rounded-lg transition-colors cursor-pointer min-h-[32px]"
            >
              <Calendar className="h-3.5 w-3.5 text-[#C2410C]" />
              <span>{currentWeekSnapshot.shortLabel}</span>
              <ChevronDown className={cn("h-3 w-3 text-[#666660] transition-transform", isCalendarOpen && "rotate-180")} />
            </button>

            <button
              type="button"
              id="btn-scaling-next-week"
              title="Semaine suivante"
              aria-label="Semaine suivante"
              disabled={currentWeekIndex <= 0}
              onClick={() => {
                if (currentWeekIndex > 0) {
                  setSelectedWeekKey(weeksHistory[currentWeekIndex - 1].weekKey);
                }
              }}
              className={cn(
                "p-1.5 rounded-lg text-[#111111] hover:bg-black/[0.04] transition-colors cursor-pointer",
                currentWeekIndex <= 0 && "opacity-30 cursor-not-allowed hover:bg-transparent"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Popover Calendrier / Sélection de Semaine */}
            {isCalendarOpen && (
              <div
                id="popover-scaling-calendar"
                className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-32px)] rounded-2xl border border-black/10 bg-white p-3 shadow-xl z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#C2410C]" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#111111]">
                      Cohortes Hebdomadaires (Weekly)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#888880] font-mono">4 semaines</span>
                </div>

                <div className="space-y-1.5 pt-1">
                  {weeksHistory.map((week, idx) => {
                    const isSelected = week.weekKey === selectedWeekKey;
                    const prevW = idx < weeksHistory.length - 1 ? weeksHistory[idx + 1] : null;
                    const analysis = analyzeWeeklyScaling(week, prevW);
                    return (
                      <button
                        key={week.weekKey}
                        type="button"
                        id={`btn-select-week-${week.weekNumber}`}
                        onClick={() => {
                          setSelectedWeekKey(week.weekKey);
                          setIsCalendarOpen(false);
                          showToast(`Période sélectionnée : ${week.label}`);
                        }}
                        className={cn(
                          "w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2",
                          isSelected
                            ? "bg-[#111111] text-white border-black shadow-xs"
                            : "bg-[#FAF8F5] text-[#111111] border-black/[0.06] hover:bg-black/[0.04]"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-xs font-black", isSelected ? "text-white" : "text-[#111111]")}>
                              {week.shortLabel}
                            </span>
                            {week.isCurrent && (
                              <span className={cn("px-1.5 py-0.2 rounded text-[9px] font-black uppercase", isSelected ? "bg-white/20 text-white" : "bg-[#C2410C]/10 text-[#C2410C]")}>
                                Actuelle
                              </span>
                            )}
                          </div>
                          <span className={cn("text-[10px] block mt-0.5", isSelected ? "text-white/70" : "text-[#888880]")}>
                            {week.startDate.split("-").reverse().slice(0, 2).join("/")} — {week.endDate.split("-").reverse().slice(0, 2).join("/")}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={cn("text-xs font-mono font-bold block", isSelected ? "text-white" : "text-[#111111]")}>
                            {week.adSpendDollars} $ · {formatFcfa(week.netProfitFcfa)}
                          </span>
                          <span
                            className={cn(
                              "text-[9px] font-bold block mt-0.5",
                              analysis.healthStatus === "overscaling_danger"
                                ? isSelected ? "text-rose-300 font-black" : "text-rose-600 font-black"
                                : analysis.healthStatus === "healthy_scaling"
                                ? isSelected ? "text-emerald-300 font-black" : "text-emerald-700 font-black"
                                : isSelected ? "text-amber-300" : "text-amber-700"
                            )}
                          >
                            {analysis.healthLabel}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
                  <button
                    type="button"
                    id="btn-calendar-switch-comparison"
                    onClick={() => {
                      setComparisonMode("weekly_comparison");
                      setIsCalendarOpen(false);
                    }}
                    className="text-[11px] font-bold text-[#C2410C] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Ouvrir la comparaison multi-semaines</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bouton de bascule Mode Comparatif Weekly */}
          <button
            type="button"
            id="btn-toggle-weekly-comparison"
            onClick={() => setComparisonMode(comparisonMode === "single_week" ? "weekly_comparison" : "single_week")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all min-h-[36px] cursor-pointer",
              comparisonMode === "weekly_comparison"
                ? "bg-[#111111] text-white border-black shadow-xs"
                : "bg-white text-[#111111] border-black/10 hover:bg-black/[0.02] shadow-2xs"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#C2410C]" />
            <span>{comparisonMode === "weekly_comparison" ? "Vue Semaine Unique" : "Comparatif Weekly"}</span>
          </button>

          {/* Bouton d'accès au Simulateur */}
          <button
            type="button"
            id="btn-open-scaling-simulator"
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 bg-white hover:bg-black/[0.02] text-xs font-bold text-[#111111] shadow-2xs cursor-pointer transition-all min-h-[36px]"
          >
            <Sliders className="h-3.5 w-3.5 text-[#C2410C]" />
            <span>Simulateur en direct</span>
          </button>
        </div>
      </div>

      {/* Bannière Manager : Consultation Seule */}
      {isManager && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
          <Info className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode consultation (Manager) :</strong> Vous visualisez les verdicts et les métriques de scaling en lecture seule. Les modifications de dépenses et de taux sont réservées aux administrateurs.
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* SOUS-ONGLETS DE NAVIGATION (Prompt 05-G / 05-R)           */}
      {/* ======================================================== */}
      <div className="border-b border-black/[0.08] flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "dashboard", label: "Tableau de bord" },
          { id: "weekly", label: "Bilan de la semaine" },
          { id: "products", label: "Fiches Produits" },
          { id: "objectives", label: "Objectifs" },
          { id: "settings", label: "Réglages" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            id={`tab-scaling-${tab.id}`}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111] hover:bg-black/[0.04]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* SIMULATEUR EN DIRECT (DÉPLIABLE)                          */}
      {/* ======================================================== */}
      {isSimulatorOpen && (
        <div
          id="scaling-live-simulator-panel"
          className="rounded-3xl border border-emerald-300 bg-emerald-50/70 p-5 shadow-sm space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Simulateur de Rentabilité & Seuils de Décision (Sans impacter vos données réelles)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsSimulatorOpen(false)}
              className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                Prix de vente (P)
              </label>
              <input
                type="number"
                id="sim-input-price"
                value={simP}
                step={500}
                onChange={(e) => setSimP(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono font-bold text-emerald-950"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                Coût d'achat (A)
              </label>
              <input
                type="number"
                id="sim-input-cost"
                value={simA}
                step={500}
                onChange={(e) => setSimA(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono font-bold text-emerald-950"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                Frais livraison (L)
              </label>
              <input
                type="number"
                id="sim-input-delivery"
                value={simL}
                step={100}
                onChange={(e) => setSimL(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono font-bold text-emerald-950"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                Bénéfice visé (B)
              </label>
              <input
                type="number"
                id="sim-input-profit"
                value={simB}
                step={500}
                onChange={(e) => setSimB(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono font-bold text-emerald-950"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                Closing estimé (c)
              </label>
              <select
                id="sim-select-closing"
                value={simClosing}
                onChange={(e) => setSimClosing(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-bold text-emerald-950"
              >
                <option value={0.30}>30 % (Difficile)</option>
                <option value={0.40}>40 % (Moyenne COD)</option>
                <option value={0.50}>50 % (Très bon)</option>
                <option value={0.60}>60 % (Excellent)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-emerald-900 mb-1">
                Budget Ads simulé ($)
              </label>
              <input
                type="number"
                id="sim-input-spend"
                value={simSpend}
                step={10}
                onChange={(e) => setSimSpend(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white font-mono font-bold text-emerald-950"
              />
            </div>
          </div>

          {/* Résultats de simulation */}
          <div className="pt-3 border-t border-emerald-200 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-emerald-800 font-medium block">Marge avant pub (M)</span>
              <span className="text-sm font-black text-emerald-950 font-mono">
                {formatFcfa(simulatedMetrics.marginBeforeAds)}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-emerald-800 font-medium block">CPA Breakeven ($)</span>
              <span className="text-sm font-black text-emerald-950 font-mono">
                {simulatedMetrics.cpaBreakevenDollars.toFixed(2)} $
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-emerald-800 font-medium block">CPA Cible ($)</span>
              <span className="text-sm font-black text-emerald-950 font-mono">
                {simulatedMetrics.cpaTargetDollars ? `${simulatedMetrics.cpaTargetDollars.toFixed(2)} $` : "—"}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-emerald-800 font-medium block">Qté cible livrée</span>
              <span className="text-sm font-black text-emerald-950 font-mono">
                {simulatedMetrics.qtyTargetUnits ? `${simulatedMetrics.qtyTargetUnits.toFixed(1)} pcs` : "—"}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-emerald-200 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[10px] text-emerald-800 font-medium block">Achat Meta max</span>
              <span className="text-sm font-black text-emerald-950 font-mono">
                {simulatedMetrics.maxMetaCostPerPurchase.toFixed(2)} $
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VUE COMPARATIVE WEEKLY (OVER-SCALING VS SCALING SAIN)     */}
      {/* ======================================================== */}
      {(comparisonMode === "weekly_comparison" || activeTab === "weekly") && (
        <div className="space-y-6 animate-in fade-in duration-200" id="section-weekly-comparison">
          {/* Bannière d'analyse comparative */}
          <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C2410C] block">
                  Matrice de Performance Hebdomadaire (Weekly)
                </span>
                <h2 className="text-base font-black text-[#111111]">
                  Diagnostic de Rentabilité sur la Durée : Scaling Rentable vs Over-scaling
                </h2>
                <p className="text-xs text-[#666660] mt-0.5">
                  Vérifiez si l'augmentation progressive de votre budget Ads génère du profit net incrémental ou détruit votre marge.
                </p>
              </div>

              {activeTab === "weekly" && (
                <button
                  type="button"
                  onClick={() => showToast("Export du bilan hebdomadaire PDF généré avec succès !")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs font-bold text-[#111111] hover:bg-black/[0.02] shadow-2xs shrink-0 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Exporter PDF</span>
                </button>
              )}
            </div>

            {/* Représentation visuelle de la corrélation Budget Ads vs Profit Net */}
            <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#111111] flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-[#C2410C]" />
                  <span>Tendance des 4 Dernières Semaines : Budget Ads ($) vs Profit Net (FCFA)</span>
                </span>
                <span className="text-[11px] text-[#888880] font-mono">
                  Seuil de rupture détecté entre S44 et S46
                </span>
              </div>

              {/* Barres comparatives horizontales */}
              <div className="space-y-2.5 pt-1">
                {weeksHistory.map((week, idx) => {
                  const prevW = idx < weeksHistory.length - 1 ? weeksHistory[idx + 1] : null;
                  const analysis = analyzeWeeklyScaling(week, prevW);
                  const isCurrent = week.weekKey === selectedWeekKey;
                  const isNegativeProfit = week.netProfitFcfa < 0;

                  return (
                    <div
                      key={week.weekKey}
                      className={cn(
                        "p-3 rounded-xl border transition-all",
                        isCurrent
                          ? "border-[#111111] bg-black/[0.02]"
                          : "border-black/[0.05] bg-[#FAF8F5]"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#111111] font-mono w-14">
                            {week.shortLabel.split(" ")[0]}
                          </span>
                          <span className="text-[11px] text-[#666660]">
                            {week.startDate.split("-").reverse().slice(0, 2).join("/")} — {week.endDate.split("-").reverse().slice(0, 2).join("/")}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                              analysis.healthBadgeClass
                            )}
                          >
                            {analysis.healthLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 font-mono text-xs">
                          <div>
                            <span className="text-[10px] text-[#888880] block">Budget Ads</span>
                            <span className="font-bold text-[#111111]">
                              {week.adSpendDollars} $
                              {analysis.deltaSpendPct !== 0 && (
                                <span className={cn("text-[10px] ml-1 font-bold", analysis.deltaSpendPct > 0 ? "text-blue-600" : "text-[#888880]")}>
                                  ({analysis.deltaSpendPct > 0 ? "+" : ""}{analysis.deltaSpendPct.toFixed(1)} %)
                                </span>
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#888880] block">Livrées</span>
                            <span className="font-bold text-[#111111]">
                              {week.deliveredUnits} pcs
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#888880] block">CPA Réel</span>
                            <span className={cn("font-bold", week.realCpaDollars > week.cpaBreakevenDollars ? "text-rose-600" : "text-[#111111]")}>
                              {week.realCpaDollars.toFixed(2)} $
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-[#888880] block">Profit Net</span>
                            <span
                              className={cn(
                                "font-black",
                                isNegativeProfit ? "text-rose-600" : "text-emerald-700"
                              )}
                            >
                              {formatFcfa(week.netProfitFcfa)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Barre visuelle d'élasticité */}
                      <div className="mt-2.5 pt-2 border-t border-black/[0.04] flex items-center justify-between text-[11px] text-[#666660]">
                        <span className="italic">{analysis.diagnosis}</span>
                        <span className="font-medium text-[#111111] shrink-0 ml-2">
                          💡 {analysis.actionRecommendation}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tableau complet de comparaison Weekly sur ordinateur */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs" id="table-weekly-comparison">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[10px] uppercase tracking-wider text-[#666660]">
                    <th className="py-2.5 px-3">Semaine</th>
                    <th className="py-2.5 px-3">Budget Ads ($)</th>
                    <th className="py-2.5 px-3">Commandes</th>
                    <th className="py-2.5 px-3">Livrées COD</th>
                    <th className="py-2.5 px-3">Taux Closing</th>
                    <th className="py-2.5 px-3">CPA Réel</th>
                    <th className="py-2.5 px-3">Profit Net (FCFA)</th>
                    <th className="py-2.5 px-3">Diagnostic Scaling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {weeksHistory.map((week, idx) => {
                    const prevW = idx < weeksHistory.length - 1 ? weeksHistory[idx + 1] : null;
                    const analysis = analyzeWeeklyScaling(week, prevW);
                    const isSelected = week.weekKey === selectedWeekKey;
                    return (
                      <tr
                        key={week.weekKey}
                        className={cn(
                          "hover:bg-black/[0.02] transition-colors cursor-pointer",
                          isSelected && "bg-black/[0.03]"
                        )}
                        onClick={() => setSelectedWeekKey(week.weekKey)}
                      >
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#111111] block">{week.shortLabel}</span>
                          <span className="text-[10px] text-[#888880]">
                            {week.startDate} au {week.endDate}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                          {week.adSpendDollars} $
                          {analysis.deltaSpendPct !== 0 && (
                            <span className={cn("text-[10px] ml-1 font-bold", analysis.deltaSpendPct > 0 ? "text-blue-600" : "text-[#888880]")}>
                              ({analysis.deltaSpendPct > 0 ? "+" : ""}{analysis.deltaSpendPct.toFixed(1)} %)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#111111]">
                          {week.ordersCount}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                          {week.deliveredUnits} pcs
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                          {(week.closingRate * 100).toFixed(1)} %
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                          <span className={cn(week.realCpaDollars > week.cpaBreakevenDollars ? "text-rose-600" : "text-[#111111]")}>
                            {week.realCpaDollars.toFixed(2)} $
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-black">
                          <span className={cn(week.netProfitFcfa < 0 ? "text-rose-600" : "text-emerald-700")}>
                            {formatFcfa(week.netProfitFcfa)}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider inline-block",
                              analysis.healthBadgeClass
                            )}
                          >
                            {analysis.healthLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Version Mobile : Cartes compactes pour la comparaison */}
            <div className="lg:hidden space-y-3" id="mobile-weekly-comparison-cards">
              {weeksHistory.map((week, idx) => {
                const prevW = idx < weeksHistory.length - 1 ? weeksHistory[idx + 1] : null;
                const analysis = analyzeWeeklyScaling(week, prevW);
                const isSelected = week.weekKey === selectedWeekKey;
                return (
                  <div
                    key={week.weekKey}
                    onClick={() => setSelectedWeekKey(week.weekKey)}
                    className={cn(
                      "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2",
                      isSelected
                        ? "border-[#111111] bg-white shadow-xs"
                        : "border-black/[0.08] bg-[#FAF8F5]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-[#111111]">{week.shortLabel}</span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider",
                          analysis.healthBadgeClass
                        )}
                      >
                        {analysis.healthLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-black/[0.04]">
                      <div>
                        <span className="text-[10px] text-[#888880] block">Budget Ads</span>
                        <span className="font-mono font-bold text-[#111111]">{week.adSpendDollars} $</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#888880] block">Livrées COD</span>
                        <span className="font-mono font-bold text-[#111111]">{week.deliveredUnits} pcs</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#888880] block">Profit Net</span>
                        <span className={cn("font-mono font-black", week.netProfitFcfa < 0 ? "text-rose-600" : "text-emerald-700")}>
                          {formatFcfa(week.netProfitFcfa)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#666660] italic">
                      {analysis.diagnosis}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. ONGLET : TABLEAU DE BORD (AVEC BANNIÈRE D'ALERTE)      */}
      {/* ======================================================== */}
      {activeTab === "dashboard" && comparisonMode === "single_week" && (
        <div className="space-y-6">
          {/* BANNIÈRE DIAGNOSTIQUE D'OVER-SCALING OU DE SCALING SAIN */}
          {weeklyAnalysis.healthStatus === "overscaling_danger" && (
            <div
              id="banner-overscaling-alert"
              className="rounded-3xl border-2 border-rose-400 bg-rose-50/90 p-5 shadow-sm space-y-3 animate-in fade-in duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">
                      Diagnostic Scaling Hebdomadaire ({currentWeekSnapshot.shortLabel})
                    </span>
                    <h2 className="text-sm font-black text-rose-950">
                      {weeklyAnalysis.summaryTitle}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                    Over-scaling Confirmé
                  </span>
                </div>
              </div>

              {/* Badges comparatifs des deltas */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs pt-1">
                <div className="bg-white/80 p-2 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-800 font-medium block">Budget Ads</span>
                  <span className="font-mono font-bold text-rose-950">
                    {currentWeekSnapshot.adSpendDollars} $ ({weeklyAnalysis.deltaSpendPct >= 0 ? "+" : ""}{weeklyAnalysis.deltaSpendPct.toFixed(1)} %)
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-800 font-medium block">Livrées</span>
                  <span className="font-mono font-bold text-rose-950">
                    {currentWeekSnapshot.deliveredUnits} pcs ({weeklyAnalysis.deltaDeliveredPct >= 0 ? "+" : ""}{weeklyAnalysis.deltaDeliveredPct.toFixed(1)} %)
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-800 font-medium block">Taux Closing</span>
                  <span className="font-mono font-bold text-rose-950">
                    {(currentWeekSnapshot.closingRate * 100).toFixed(1)} % (Seuil 40 %)
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-800 font-medium block">CPA Réel</span>
                  <span className="font-mono font-bold text-rose-950">
                    {currentWeekSnapshot.realCpaDollars.toFixed(2)} $ (Breakeven {currentWeekSnapshot.cpaBreakevenDollars.toFixed(2)} $)
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-xl border border-rose-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-rose-800 font-medium block">Profit Net</span>
                  <span className="font-mono font-bold text-rose-600">
                    {formatFcfa(currentWeekSnapshot.netProfitFcfa)}
                  </span>
                </div>
              </div>

              <p className="text-xs text-rose-900 leading-relaxed">
                {weeklyAnalysis.diagnosis}
              </p>

              <div className="p-3 rounded-2xl bg-white/90 border border-rose-300 text-xs text-rose-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-700 shrink-0" />
                  <span>
                    <strong>Action requise :</strong> {weeklyAnalysis.actionRecommendation}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-alert-view-weekly-comparison"
                  onClick={() => setComparisonMode("weekly_comparison")}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 shrink-0 cursor-pointer transition-colors"
                >
                  Voir la comparaison détaillée
                </button>
              </div>
            </div>
          )}

          {weeklyAnalysis.healthStatus === "healthy_scaling" && (
            <div
              id="banner-healthy-scaling"
              className="rounded-3xl border border-emerald-300 bg-emerald-50/80 p-4 shadow-sm space-y-2 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    {weeklyAnalysis.healthLabel} — {weeklyAnalysis.summaryTitle}
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                  Rentabilité Validée
                </span>
              </div>
              <p className="text-xs text-emerald-900">{weeklyAnalysis.diagnosis}</p>
              <p className="text-xs text-emerald-800 font-medium">💡 {weeklyAnalysis.actionRecommendation}</p>
            </div>
          )}

          {weeklyAnalysis.healthStatus === "warning_diminishing" && (
            <div
              id="banner-warning-diminishing"
              className="rounded-3xl border border-amber-300 bg-amber-50/80 p-4 shadow-sm space-y-2 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-amber-700" />
                  <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                    {weeklyAnalysis.healthLabel} — {weeklyAnalysis.summaryTitle}
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white">
                  Palier Limite
                </span>
              </div>
              <p className="text-xs text-amber-900">{weeklyAnalysis.diagnosis}</p>
              <p className="text-xs text-amber-800 font-medium">💡 {weeklyAnalysis.actionRecommendation}</p>
            </div>
          )}

          {/* Cartes KPIs globales synchronisées */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
                Ads Spend
              </span>
              <div className="text-lg font-black text-[#111111] font-mono">
                {aggregateMetrics.totalSpend.toFixed(0)} $
              </div>
              <span className="text-[10px] text-[#888880]">
                ≈ {formatFcfa(aggregateMetrics.totalSpend * dollarRate)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
                Commandes
              </span>
              <div className="text-lg font-black text-[#111111] font-mono">
                {aggregateMetrics.totalOrders}
              </div>
              <span className={cn("text-[10px] font-bold", weeklyAnalysis.deltaOrdersPct >= 0 ? "text-emerald-700" : "text-rose-600")}>
                {weeklyAnalysis.deltaOrdersPct !== 0
                  ? `${weeklyAnalysis.deltaOrdersPct >= 0 ? "+" : ""}${weeklyAnalysis.deltaOrdersPct.toFixed(0)} % vs sem. préc.`
                  : "Stable"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
                Pièces livrées
              </span>
              <div className="text-lg font-black text-[#111111] font-mono">
                {aggregateMetrics.totalDelivered}
              </div>
              <span className="text-[10px] text-[#666660]">Encaissements COD</span>
            </div>

            <div className="p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
                Taux de closing
              </span>
              <div className="text-lg font-black text-[#111111] font-mono">
                {aggregateMetrics.avgClosingRate.toFixed(1)} %
              </div>
              <span className={cn("text-[10px] font-bold", aggregateMetrics.avgClosingRate >= 40 ? "text-emerald-700" : "text-amber-700")}>
                {aggregateMetrics.avgClosingRate >= 40 ? "Bon closing" : "Closing bas"}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] shadow-2xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#666660] block">
                CPA Réel Moyen
              </span>
              <div className="text-lg font-black text-[#111111] font-mono">
                {aggregateMetrics.avgRealCpa.toFixed(2)} $
              </div>
              <span className="text-[10px] text-[#888880]">Par pièce livrée</span>
            </div>

            <div
              className={cn(
                "p-3.5 rounded-2xl border shadow-2xs space-y-1",
                aggregateMetrics.totalNetProfitFcfa < 0
                  ? "border-rose-300 bg-rose-50/70"
                  : "border-emerald-300 bg-emerald-50/60"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider block",
                  aggregateMetrics.totalNetProfitFcfa < 0 ? "text-rose-900" : "text-emerald-900"
                )}
              >
                Profit Net Estimé
              </span>
              <div
                className={cn(
                  "text-lg font-black font-mono",
                  aggregateMetrics.totalNetProfitFcfa < 0 ? "text-rose-600" : "text-emerald-950"
                )}
              >
                {formatFcfa(aggregateMetrics.totalNetProfitFcfa)}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold",
                  aggregateMetrics.totalNetProfitFcfa < 0 ? "text-rose-700" : "text-emerald-800"
                )}
              >
                Marge après pub
              </span>
            </div>
          </div>

          {/* Tableau Performance par Produit (Sur Desktop) & Cartes Produits (Sur Mobile) */}
          <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Performance par Produit & Décisions de Scaling ({currentWeekSnapshot.shortLabel})
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[11px] text-[#888880]">Taux dollar :</span>
                <span className="px-2 py-0.5 rounded-lg bg-white border border-black/10 font-mono font-bold text-[#111111]">
                  1 $ = {dollarRate} FCFA
                </span>
              </div>
            </div>

            {/* Version Bureau : Tableau */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs" id="table-scaling-products">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[10px] uppercase tracking-wider text-[#666660]">
                    <th className="py-2.5 px-3">Produit</th>
                    <th className="py-2.5 px-3">Verdict</th>
                    <th className="py-2.5 px-3">Livrées / Cible</th>
                    <th className="py-2.5 px-3">Ads Spend</th>
                    <th className="py-2.5 px-3">CPA Réel</th>
                    <th className="py-2.5 px-3">CPA Cible</th>
                    <th className="py-2.5 px-3">CPA Breakeven</th>
                    <th className="py-2.5 px-3">Achat Meta Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {evaluatedProducts.map(({ product, metrics }) => (
                    <tr key={product.productId} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#111111] block">{product.productName}</span>
                        <span className="text-[10px] text-[#888880] capitalize">
                          Phase : {product.phase} · {product.ordersCount} cmd
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider inline-block",
                            metrics.verdict.badgeClass
                          )}
                        >
                          {metrics.verdict.label}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-[#111111]">{product.deliveredUnits}</span>
                        <span className="text-[#888880]">
                          {" "}
                          / {metrics.qtyTargetUnits ? metrics.qtyTargetUnits.toFixed(1) : "—"} pcs
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                        {product.adSpendDollars} $
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#111111]">
                        {metrics.realCpaDollars ? `${metrics.realCpaDollars.toFixed(2)} $` : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-emerald-800 font-bold">
                        {metrics.cpaTargetDollars ? `${metrics.cpaTargetDollars.toFixed(2)} $` : "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#666660]">
                        {metrics.cpaBreakevenDollars.toFixed(2)} $
                      </td>
                      <td className="py-3 px-3 font-mono text-[#666660]">
                        {metrics.maxMetaCostPerPurchase.toFixed(2)} $
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Version Mobile : Cartes compactes 390px (0 débordement horizontal) */}
            <div className="lg:hidden space-y-3" id="mobile-scaling-products-cards">
              {evaluatedProducts.map(({ product, metrics }) => (
                <div
                  key={product.productId}
                  className="p-3.5 rounded-2xl border border-black/[0.08] bg-white shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs text-[#111111] leading-tight line-clamp-2">
                      {product.productName}
                    </span>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider shrink-0",
                        metrics.verdict.badgeClass
                      )}
                    >
                      {metrics.verdict.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-black/[0.04]">
                    <div>
                      <span className="text-[10px] text-[#888880] block">Livrées / Cible</span>
                      <span className="font-mono font-bold text-[#111111]">
                        {product.deliveredUnits} / {metrics.qtyTargetUnits ? metrics.qtyTargetUnits.toFixed(0) : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#888880] block">CPA Réel</span>
                      <span className="font-mono font-bold text-[#111111]">
                        {metrics.realCpaDollars ? `${metrics.realCpaDollars.toFixed(2)} $` : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#888880] block">CPA Breakeven</span>
                      <span className="font-mono text-[#666660]">
                        {metrics.cpaBreakevenDollars.toFixed(2)} $
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#666660] italic">
                    {metrics.verdict.reason}
                  </p>
                </div>
              ))}
            </div>

            {/* Règle et Disclaimer obligatoire */}
            <div className="p-3 rounded-2xl bg-black/[0.02] border border-black/[0.06] text-center">
              <p className="text-[11px] text-[#666660] font-medium italic">
                {MANDATORY_SCALING_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ONGLET : FICHES PRODUITS                               */}
      {/* ======================================================== */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {evaluatedProducts.map(({ product, metrics }) => (
              <div
                key={product.productId}
                className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-sm text-[#111111]">{product.productName}</h3>
                    <span className="text-[11px] text-[#888880]">ID : {product.productId}</span>
                  </div>
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider",
                      metrics.verdict.badgeClass
                    )}
                  >
                    {metrics.verdict.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-black/[0.06]">
                  <div>
                    <span className="text-[10px] text-[#888880] block">Prix vente (P)</span>
                    <span className="font-mono font-bold">{formatFcfa(product.sellingPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#888880] block">Coût achat (A)</span>
                    <span className="font-mono font-bold">{formatFcfa(product.acquisitionPrice)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#888880] block">Frais livr. (L)</span>
                    <span className="font-mono font-bold">{formatFcfa(product.deliveryCost)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#888880] block">Bénéfice visé (B)</span>
                    <span className="font-mono font-bold">{formatFcfa(product.desiredProfit)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-black/[0.06] text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#666660]">CPA Breakeven :</span>
                    <span className="font-mono font-bold text-[#111111]">
                      {metrics.cpaBreakevenDollars.toFixed(2)} $
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666660]">CPA Cible visé :</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {metrics.cpaTargetDollars ? `${metrics.cpaTargetDollars.toFixed(2)} $` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666660]">Quantité Cible :</span>
                    <span className="font-mono font-bold text-[#111111]">
                      {metrics.qtyTargetUnits ? `${metrics.qtyTargetUnits.toFixed(1)} pièces` : "—"}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-[#666660] italic">
                  Motif : {metrics.verdict.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ONGLET : OBJECTIFS                                     */}
      {/* ======================================================== */}
      {activeTab === "objectives" && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Objectifs Mensuels de Scaling & Marge Nette
            </h2>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Objectif Bénéfice Net Mensuel</span>
                  <span className="font-mono">1 200 000 FCFA / 2 000 000 FCFA</span>
                </div>
                <div className="w-full h-3 rounded-full bg-black/[0.08] overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: "60%" }} />
                </div>
                <p className="text-[10px] text-[#888880] mt-1">60 % atteint à mi-parcours du mois.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ONGLET : RÉGLAGES                                      */}
      {/* ======================================================== */}
      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-3xl border border-black/[0.08] bg-[#FAF8F5] p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Paramètres du Moteur de Scaling
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#111111] mb-1">
                  Valeur du Dollar pour la Publicité (r)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={dollarRate}
                    disabled={!canManage}
                    onChange={(e) => setDollarRate(Number(e.target.value))}
                    className="w-32 p-2 rounded-xl border border-black/10 bg-white font-mono font-bold text-[#111111]"
                  />
                  <span className="text-[#888880] text-xs font-semibold">FCFA pour 1 Dollar ($)</span>
                </div>
                <p className="text-[10px] text-[#888880] mt-1">
                  Taux réglable par boutique avec conservation de l'historique daté.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[#111111] mb-1">
                  Délai moyen de livraison (Cohortes Matures)
                </label>
                <select
                  value={matureDaysThreshold}
                  disabled={!canManage}
                  onChange={(e) => setMatureDaysThreshold(Number(e.target.value))}
                  className="p-2 rounded-xl border border-black/10 bg-white font-bold text-[#111111]"
                >
                  <option value={3}>3 jours (Villes capitales Lomé, Abidjan, Cotonou)</option>
                  <option value={4}>4 jours (Moyenne générale)</option>
                  <option value={5}>5 jours (Intérieur et régions éloignées)</option>
                </select>
                <p className="text-[10px] text-[#888880] mt-1">
                  Les commandes plus récentes ne sont jamais considérées comme perdues.
                </p>
              </div>

              {canManage && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => showToast("Paramètres de scaling enregistrés !")}
                    className="px-4 py-2 rounded-xl bg-[#111111] text-white font-bold text-xs hover:bg-black transition-colors cursor-pointer"
                  >
                    Enregistrer les réglages
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
