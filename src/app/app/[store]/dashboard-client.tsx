"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  AlertTriangle,
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
import type { PeriodType } from "@/mock-data/dashboard";
import { mapApiOrder } from "@/lib/orders-api";
import { useApp } from "@/components/layout/app-shell";
import { OnboardingCard } from "@/components/dashboard/onboarding-card";
import { InitialSetupWizard } from "@/components/dashboard/initial-setup-wizard";
import { RevenueGoalCard } from "@/components/finance/revenue-goal-card";
import { MOCK_GOALS } from "@/mock-data/goals";
import { ChartDayData, DashboardKpi, Order, StatusDistributionItem, TopProduct } from "@/server/data/types";

export function DashboardClient({ storeSlug }: { storeSlug: string }) {
  const { activeStore } = useApp();
  const [period, setPeriod] = useState<PeriodType>("last7");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Chiffres réels de la boutique (base de données) sur la période choisie
  const range = useMemo(() => {
    const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const now = new Date();
    const day = 86400000;
    switch (period) {
      case "today": return { from: iso(now), to: iso(now) };
      case "yesterday": return { from: iso(new Date(now.getTime() - day)), to: iso(new Date(now.getTime() - day)) };
      case "last30": return { from: iso(new Date(now.getTime() - 29 * day)), to: iso(now) };
      case "thisMonth": return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
      default: return { from: iso(new Date(now.getTime() - 6 * day)), to: iso(now) };
    }
  }, [period]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<{ current: any; previous: any } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch(`/api/dashboard?store=${encodeURIComponent(storeSlug)}&from=${range.from}&to=${range.to}`)
        .then((r) => r.json())
        .then((d) => alive && d?.success && setStats({ current: d.current, previous: d.previous }))
        .catch(() => {});
    void load();
    const t = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [storeSlug, range]);

  useEffect(() => {
    fetch(`/api/orders?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => d?.success && Array.isArray(d.orders) && setOrders(d.orders.map(mapApiOrder)))
      .catch(() => {});
  }, [storeSlug]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sum = (days: any[] | undefined, k: string) => (days || []).reduce((acc, d) => acc + (Number(d[k]) || 0), 0);
  const delta = (cur: number, prev: number | null) => (prev === null || prev === 0 ? 0 : Math.round(((cur - prev) / prev) * 100));
  const kpi = (k: string): { value: number; delta: number; isUpGood: boolean } => {
    const cur = sum(stats?.current?.days, k);
    return { value: cur, delta: delta(cur, stats?.previous ? sum(stats.previous.days, k) : null), isUpGood: true };
  };

  const kpis: DashboardKpi = {
    visitors: { value: 0, delta: 0, isUpGood: true },
    totalSales: kpi("total_sales"),
    deliveredSales: kpi("delivered_sales"),
    ordersCount: kpi("orders"),
    conversionRate: { value: 0, delta: 0, isUpGood: true },
    pendingOrdersCount: Number(stats?.current?.pending_count) || 0,
    todayDeliveriesCount: Number(stats?.current?.today_deliveries) || 0,
  };

  const STATUS_META: [string, string, string][] = [
    ["delivered", "Livrées", "#10B981"],
    ["pending", "À confirmer", "#3B82F6"],
    ["scheduled", "Programmées", "#F59E0B"],
    ["cancelled", "Annulées", "#EF4444"],
    ["rejected", "Rejetées", "#8B5CF6"],
  ];
  const statusCounts: Record<string, number> = stats?.current?.statuses || {};
  const statusTotal = STATUS_META.reduce((a, [k]) => a + (Number(statusCounts[k]) || 0), 0);
  const emptyStatusDistribution: StatusDistributionItem[] = STATUS_META.map(([status, label, color]) => {
    const count = Number(statusCounts[status]) || 0;
    return { status: status as StatusDistributionItem["status"], label, count, percentage: statusTotal ? Math.round((count / statusTotal) * 100) : 0, color };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emptyChartDays: ChartDayData[] = ((stats?.current?.days as any[]) || []).map((d) => {
    const productCost = Number(d.product_cost) || 0;
    const shippingCost = Number(d.rider_fees) || 0;
    const adSpend = Number(d.ad_spend) || 0;
    const delivered = Number(d.delivered_count) || 0;
    const deliveredSales = Number(d.delivered_sales) || 0;
    return {
      date: d.date,
      dayLabel: new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      visitors: 0,
      totalSales: Number(d.total_sales) || 0,
      deliveredSales,
      orders: Number(d.orders) || 0,
      deliveredCount: delivered,
      adSpend,
      productCost,
      shippingCost,
      netProfit: deliveredSales - productCost - shippingCost - adSpend - (Number(d.other_expenses) || 0),
      realCpa: delivered > 0 ? Math.round(adSpend / delivered) : 0,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topProducts: TopProduct[] = ((stats?.current?.top_products as any[]) || []).map((t) => ({
    id: String(t.id),
    name: t.name,
    category: "",
    image: "",
    unitsSold: Number(t.units) || 0,
    revenue: Number(t.revenue) || 0,
    stock: 0,
    changePercent: 0,
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
        <CorridorsStatusBar storeSlug={storeSlug} />
      </ScrollReveal>

      {/* 3. Hero Command Center : Carte « En direct » avec Globe 3D interactif + Sélecteur de date universel + Les 5 Cartes KPI */}
      <ScrollReveal delay={100}>
        <LiveGlobeCard
          storeSlug={storeSlug}
          storeName={activeStore?.name || storeSlug}
          currency={activeStore?.currency || "XOF"}
          period={period}
          onPeriodChange={handlePeriodChange}
          periodLabels={periodLabels}
          kpis={kpis}
        />
      </ScrollReveal>

      {/* 3.B. Objectif du mois de CA encaissé (Barre segmentée + Allure) */}
      {MOCK_GOALS.length > 0 && (
        <ScrollReveal delay={120}>
          <RevenueGoalCard
            goal={MOCK_GOALS[0]}
            basePath={`/app/${storeSlug}`}
          />
        </ScrollReveal>
      )}

      {/* Alerte et compteur "Commandes en attente de stock" (Prompt 16-b) */}
      {orders.filter((o) => o.status === "pending_stock").length > 0 && (
        <ScrollReveal delay={130}>
          <Link
            href={`/app/${storeSlug}/commandes?statut=pending_stock`}
            className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 hover:border-amber-400 text-amber-950 shadow-sm transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-2">
                  <span>Alerte Réappro · Commandes en attente de stock</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                    Action requise
                  </span>
                </p>
                <p className="text-xs text-amber-800 mt-0.5">
                  {orders.filter((o) => o.status === "pending_stock").length} commande(s) COD bloquée(s) par manque de stock physique. Cliquez pour traiter ou lancer un réapprovisionnement.
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-amber-600 text-white text-xs font-black shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {orders.filter((o) => o.status === "pending_stock").length} en attente
            </span>
          </Link>
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
              <div className="h-9 w-9 rounded-xl bg-[#1F3A26] text-[#FAF8F5] flex items-center justify-center shrink-0 font-bold shadow-2xs">
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
            <span className="px-2 py-0.5 rounded-full bg-[#1F3A26] text-[#FAF8F5] text-xs font-black shadow-2xs shrink-0">
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
        <MainPerformanceChart data={emptyChartDays} />
      </ScrollReveal>

      {/* 6. Grille 2 Colonnes : Répartition des Statuts & Meilleurs Produits */}
      <ScrollReveal delay={250}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <StatusDonutChart
              items={emptyStatusDistribution}
              totalOrders={kpis.ordersCount.value}
              className="h-full"
            />
          </div>

          <div className="lg:col-span-7">
            <TopProductsCard
              products={topProducts}
              storeSlug={storeSlug}
              className="h-full"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* 7. Graphique « Budget, coûts, bénéfice et livraisons » avec cases à cocher et pastilles de couleur cliquables */}
      <ScrollReveal delay={300}>
        <ProfitDeliveryChart data={emptyChartDays} />
      </ScrollReveal>

      {/* 8. Tableau des Dernières Commandes (Desktop & Mobile First) */}
      <ScrollReveal delay={350}>
        <RecentOrdersTable orders={orders} storeSlug={storeSlug} />
      </ScrollReveal>
    </div>
  );
}
