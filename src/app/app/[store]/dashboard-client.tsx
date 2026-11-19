"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Layers,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { CorridorsStatusBar } from "@/components/dashboard/corridors-status-bar";

// Prompt 05-Q : Chargement différé du Globe 3D WebGL pour affichage instantané < 1s
const LiveGlobeCard = dynamic(
  () => import("@/components/dashboard/live-globe-card").then((mod) => mod.LiveGlobeCard),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-sm min-h-[220px] flex items-center justify-center animate-pulse">
        <span className="text-xs text-[#888880] font-semibold">Initialisation de la tour de contrôle en direct...</span>
      </div>
    ),
  }
);

import { MainPerformanceChart } from "@/components/dashboard/main-performance-chart";
import { StatusDonutChart } from "@/components/dashboard/status-donut-chart";
import { TopProductsCard } from "@/components/dashboard/top-products-card";
import { ProfitDeliveryChart } from "@/components/dashboard/profit-delivery-chart";
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import {
  MOCK_CHART_DAYS,
  MOCK_KPIS_BY_PERIOD,
  MOCK_STATUS_DISTRIBUTION,
  MOCK_TOP_PRODUCTS,
  PeriodType,
} from "@/mock-data/dashboard";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { useApp } from "@/components/layout/app-shell";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { InitialSetupWizard } from "@/components/dashboard/initial-setup-wizard";
import { RevenueGoalCard } from "@/components/finance/revenue-goal-card";
import { MOCK_GOALS } from "@/mock-data/goals";
import { ChartDayData, DashboardKpi, Order, StatusDistributionItem } from "@/server/data/types";

export function DashboardClient({ storeSlug }: { storeSlug: string }) {
  const { activeStore } = useApp();
  const [period, setPeriod] = useState<PeriodType>("last7");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const isFounderDemo = storeSlug === "lome-glow";

  const emptyKpis: DashboardKpi = {
    visitors: { value: 0, delta: 0, isUpGood: true },
    totalSales: { value: 0, delta: 0, isUpGood: true },
    deliveredSales: { value: 0, delta: 0, isUpGood: true },
    ordersCount: { value: 0, delta: 0, isUpGood: true },
    conversionRate: { value: 0, delta: 0, isUpGood: true },
    pendingOrdersCount: 0,
    todayDeliveriesCount: 0,
  };

  const kpis = isFounderDemo ? (MOCK_KPIS_BY_PERIOD[period] || MOCK_KPIS_BY_PERIOD.last7) : emptyKpis;

  const [orders] = useState<Order[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`novika_store_orders_${storeSlug}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      if (!isFounderDemo) return [];
    }
    return isFounderDemo ? MOCK_ORDERS : [];
  });

  const emptyStatusDistribution: StatusDistributionItem[] = [
    { status: "delivered", label: "Livrées", count: 0, percentage: 0, color: "#10B981" },
    { status: "pending", label: "À confirmer", count: 0, percentage: 0, color: "#3B82F6" },
    { status: "scheduled", label: "Programmées", count: 0, percentage: 0, color: "#F59E0B" },
    { status: "cancelled", label: "Annulées", count: 0, percentage: 0, color: "#EF4444" },
    { status: "rejected", label: "Rejetées", count: 0, percentage: 0, color: "#8B5CF6" },
  ];

  const emptyChartDays: ChartDayData[] = MOCK_CHART_DAYS.map((d) => ({
    ...d,
    visitors: 0,
    sales: 0,
    orders: 0,
    delivered: 0,
    profit: 0,
    expenses: 0,
  }));

  const periodLabels: Record<PeriodType, string> = {
    today: "Aujourd'hui",
    yesterday: "Hier",
    last7: "7 derniers jours",
    last30: "30 derniers jours",
    thisMonth: "Ce mois-ci",
    custom: "Période personnalisée",
  };

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 0. Assistant d'installation après inscription (Carte "Pour commencer") */}
      <ScrollReveal delay={0}>
        <OnboardingCard storeSlug={storeSlug} />
      </ScrollReveal>

      {/* Assistant Initial 3 questions (accessible aussi via wizard) */}
      <InitialSetupWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialStoreName={activeStore.name}
        initialCountry={activeStore.country}
        onComplete={(data) => {
          console.log("Configuration initiale enregistrée :", data);
        }}
      />

      {/* 1. Page Header avec Titre et Badge Boutique */}
      <ScrollReveal delay={0}>
        <PageHeader
          title="Tableau de bord"
          description={`Bienvenue sur le centre de commande de ${activeStore.name}. Analysez vos flux COD, vos livraisons et votre bénéfice net réel.`}
          badge={
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FAF8F5] text-[#111111] border border-black/[0.08] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Télémétrie en direct
            </span>
          }
        />
      </ScrollReveal>

      {/* 2. Barre de Statut Statique des Corridors COD (TG, CI, SN, BJ) */}
      <ScrollReveal delay={50}>
        <CorridorsStatusBar />
      </ScrollReveal>

      {/* 3. Hero Command Center : Carte « En direct » avec Globe 3D interactif + Sélecteur de date universel + Les 5 Cartes KPI */}
      <ScrollReveal delay={100}>
        <LiveGlobeCard
          storeSlug={storeSlug}
          storeName={activeStore.name}
          currency={activeStore.currency}
          period={period}
          onPeriodChange={handlePeriodChange}
          periodLabels={periodLabels}
          kpis={kpis}
        />
      </ScrollReveal>

      {/* 3.B. Objectif du mois de CA encaissé (Barre segmentée + Allure) */}
      {isFounderDemo && (
        <ScrollReveal delay={120}>
          <RevenueGoalCard
            goal={MOCK_GOALS[0]}
            basePath={`/app/${storeSlug}`}
          />
        </ScrollReveal>
      )}

      {/* 4. Raccourcis Rapides (Quick Actions Bar) */}
      <ScrollReveal delay={150}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Raccourci 1 : Traiter les commandes */}
          <Link
            href={`/app/${storeSlug}/commandes?statut=pending`}
            className="group relative flex items-center justify-between p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] hover:border-black/20 transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-[#111111] text-[#FAF8F5] flex items-center justify-center shrink-0 font-bold shadow-2xs">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#111111] truncate">
                  Traiter commandes
                </p>
                <p className="text-[11px] text-[#666660] font-medium">
                  À confirmer
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#111111] text-[#FAF8F5] text-xs font-black shadow-2xs shrink-0">
              {kpis.pendingOrdersCount}
            </span>
          </Link>

          {/* Raccourci 2 : Livraisons du jour */}
          <Link
            href={`/app/${storeSlug}/livraisons`}
            className="group relative flex items-center justify-between p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] hover:border-black/20 transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-[#F3EFE6] border border-black/[0.06] text-[#111111] flex items-center justify-center shrink-0">
                <Truck className="h-4 w-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-[#111111] truncate">
                  Tournées livraisons
                </p>
                <p className="text-[11px] text-[#666660] font-medium">
                  Aujourd'hui
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#111111] border border-black/[0.08] text-xs font-black shrink-0">
              {kpis.todayDeliveriesCount}
            </span>
          </Link>

          {/* Raccourci 3 : Ajouter un produit */}
          <Link
            href={`/app/${storeSlug}/produits/nouveau`}
            className="group flex items-center gap-2.5 p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] hover:border-black/20 transition-all shadow-2xs"
          >
            <div className="h-9 w-9 rounded-xl bg-[#F3EFE6] border border-black/[0.06] text-[#111111] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Plus className="h-4 w-4" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-[#111111] truncate">
                Ajouter un produit
              </p>
              <p className="text-[11px] text-[#666660]">
                Photos, prix & packs
              </p>
            </div>
          </Link>

          {/* Raccourci 4 : Nouvelle commande manuelle */}
          <Link
            href={`/app/${storeSlug}/commandes/nouvelle`}
            className="group flex items-center gap-2.5 p-3.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] hover:border-black/20 transition-all shadow-2xs"
          >
            <div className="h-9 w-9 rounded-xl bg-[#F3EFE6] border border-black/[0.06] text-[#111111] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4 text-[#111111]" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-[#111111] truncate">
                Commande manuelle
              </p>
              <p className="text-[11px] text-[#666660]">
                Saisie directe client
              </p>
            </div>
          </Link>
        </div>
      </ScrollReveal>

      {/* 5. Graphique Principal : Visiteurs / Ventes / Commandes / Livrées avec onglets */}
      <ScrollReveal delay={200}>
        <MainPerformanceChart data={isFounderDemo ? MOCK_CHART_DAYS : emptyChartDays} />
      </ScrollReveal>

      {/* 6. Grille 2 Colonnes : Répartition des Statuts & Meilleurs Produits */}
      <ScrollReveal delay={250}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <StatusDonutChart
              items={isFounderDemo ? MOCK_STATUS_DISTRIBUTION : emptyStatusDistribution}
              totalOrders={kpis.ordersCount.value}
              className="h-full"
            />
          </div>

          <div className="lg:col-span-7">
            <TopProductsCard
              products={isFounderDemo ? MOCK_TOP_PRODUCTS : []}
              storeSlug={storeSlug}
              className="h-full"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* 7. Graphique « Budget, coûts, bénéfice et livraisons » avec cases à cocher et pastilles de couleur cliquables */}
      <ScrollReveal delay={300}>
        <ProfitDeliveryChart data={isFounderDemo ? MOCK_CHART_DAYS : emptyChartDays} />
      </ScrollReveal>

      {/* 8. Tableau des Dernières Commandes (Desktop & Mobile First) */}
      <ScrollReveal delay={350}>
        <RecentOrdersTable orders={orders} storeSlug={storeSlug} />
      </ScrollReveal>
    </div>
  );
}
