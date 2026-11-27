"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Radio,
  ShoppingBag,
  Percent,
  MapPin,
  ExternalLink,
  Target,
  Sparkles,
  ArrowUpRight,
  Flame,
  Award,
  CheckCircle2,
  RotateCcw,
  Wallet,
  ShoppingCart,
} from "lucide-react";
import { StatCard, StatCardsGrid } from "@/components/app/stat-card";
import { MOCK_LIVE_STATS, type SalesOverview } from "@/mock-data/stats";
import { mapApiOrder } from "@/lib/orders-api";
import type { CloserClosingStats, Order, UtmCampaignStats } from "@/server/data/types";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";

interface StatsClientProps {
  storeSlug: string;
}

export function StatsClient({ storeSlug }: StatsClientProps) {
  const [activeTab, setActiveTab] = useState<"sales" | "closing" | "live">("sales");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch(`/api/orders?store=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((d) => d?.success && Array.isArray(d.orders) && setOrders(d.orders.map(mapApiOrder)))
      .catch(() => {});
  }, [storeSlug]);

  // Toutes les statistiques sont calculées à partir des vraies commandes
  const { MOCK_SALES_OVERVIEW, MOCK_CLOSING_STATS, MOCK_UTM_CAMPAIGNS } = useMemo(() => {
    const delivered = orders.filter((o) => o.status === "delivered");
    const returned = orders.filter((o) => ["rejected", "rejected_invalid_number"].includes(o.status as string));
    const gross = orders.reduce((a, o) => a + o.totalAmount, 0);
    const returns = returned.reduce((a, o) => a + o.totalAmount, 0);
    const netSales = delivered.reduce((a, o) => a + o.totalAmount, 0);

    const byProduct = new Map<string, { revenue: number; orders: number }>();
    delivered.forEach((o) =>
      o.items.forEach((it) => {
        const e = byProduct.get(it.productName) || { revenue: 0, orders: 0 };
        e.revenue += it.totalPrice;
        e.orders += 1;
        byProduct.set(it.productName, e);
      })
    );
    const prodTotal = Array.from(byProduct.values()).reduce((a, v) => a + v.revenue, 0);
    const salesByCategory = Array.from(byProduct.entries())
      .map(([category, v]) => ({ category, revenue: v.revenue, orders: v.orders, percentage: prodTotal ? Math.round((v.revenue / prodTotal) * 100) : 0 }))
      .sort((a, b) => b.revenue - a.revenue);

    const COUNTRY: Record<string, { name: string; flag: string }> = {
      TG: { name: "Togo", flag: "🇹🇬" }, BJ: { name: "Bénin", flag: "🇧🇯" },
      CI: { name: "Côte d'Ivoire", flag: "🇨🇮" }, SN: { name: "Sénégal", flag: "🇸🇳" },
    };
    const byCountry = new Map<string, Order[]>();
    orders.forEach((o) => byCountry.set(o.country, [...(byCountry.get(o.country) || []), o]));
    const salesByCountry = Array.from(byCountry.entries()).map(([country, list]) => {
      const del = list.filter((o) => o.status === "delivered");
      return {
        country,
        countryName: COUNTRY[country]?.name || country,
        flag: COUNTRY[country]?.flag || "🌍",
        orders: list.length,
        deliveredRate: list.length ? Math.round((del.length / list.length) * 100) : 0,
        revenue: del.reduce((a, o) => a + o.totalAmount, 0),
      };
    });

    const overview: SalesOverview = {
      grossSales: gross,
      discounts: 0,
      returns,
      netSales,
      averageOrderValue: delivered.length ? Math.round(netSales / delivered.length) : 0,
      deliveredOrders: delivered.length,
      totalOrders: orders.length,
      salesByCategory,
      salesByCountry,
      salesByCity: [],
    };

    const byCloser = new Map<string, { name: string; list: Order[] }>();
    orders.forEach((o) => {
      if (!o.assignedCloser) return;
      const e = byCloser.get(o.assignedCloser.id) || { name: o.assignedCloser.name, list: [] };
      e.list.push(o);
      byCloser.set(o.assignedCloser.id, e);
    });
    const closing: CloserClosingStats[] = Array.from(byCloser.entries()).map(([closerId, v]) => {
      const confirmed = v.list.filter((o) => !["pending", "unreachable", "rejected", "rejected_invalid_number", "lost_unreachable", "cancelled"].includes(o.status as string));
      const del = v.list.filter((o) => o.status === "delivered");
      return {
        closerId,
        closerName: v.name,
        assignedOrders: v.list.length,
        confirmedOrders: confirmed.length,
        confirmationRate: v.list.length ? Math.round((confirmed.length / v.list.length) * 100) : 0,
        deliveredOrders: del.length,
        deliveryRate: v.list.length ? Math.round((del.length / v.list.length) * 100) : 0,
        deliveredRevenue: del.reduce((a, o) => a + o.totalAmount, 0),
      };
    });

    const byCamp = new Map<string, Order[]>();
    orders.forEach((o) => {
      if (!o.utm?.campaign && !o.utm?.source) return;
      const key = `${o.utm?.campaign || "(sans campagne)"}||${o.utm?.source || "direct"}`;
      byCamp.set(key, [...(byCamp.get(key) || []), o]);
    });
    const utm: UtmCampaignStats[] = Array.from(byCamp.entries()).map(([key, list]) => {
      const [campaign, source] = key.split("||");
      return {
        campaign, source, visitors: 0, orders: list.length, conversionRate: 0,
        revenue: list.filter((o) => o.status === "delivered").reduce((a, o) => a + o.totalAmount, 0),
        adSpend: 0, roas: 0,
      };
    });

    return { MOCK_SALES_OVERVIEW: overview, MOCK_CLOSING_STATS: closing, MOCK_UTM_CAMPAIGNS: utm };
  }, [orders]);

  return (
    <div className="space-y-6 pb-24">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#666660]">
              Analyses & Performances
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
            Statistiques & Rapports
          </h1>
          <p className="text-xs text-[#666660] mt-0.5">
            Suivi des ventes nettes, closing WhatsApp des closeuses, campagnes publicitaires et trafic live.
          </p>
        </div>

        {/* Onglets principaux */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-1 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("sales")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "sales"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Rapports de ventes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("closing")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "closing"
                ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Rapport de closing</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("live")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
              activeTab === "live"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-[#666660] hover:text-[#111111]"
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live ({MOCK_LIVE_STATS.currentVisitors})</span>
          </button>
        </div>
      </div>

      {/* CONTENU ONGLET 1 : RAPPORTS DE VENTES */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          {/* Cartes KPI : Ventes brutes, Remises, Retours, Ventes nettes, Panier moyen */}
          <StatCardsGrid id="stats-overview-cards-grid">
            <StatCard
              id="stat-card-gross-sales"
              label="Ventes Brutes"
              numericValue={MOCK_SALES_OVERVIEW.grossSales}
              currency="FCFA"
              hint="Avant déductions"
              icon={ShoppingBag}
            />

            <StatCard
              id="stat-card-discounts"
              label="Remises Offertes"
              numericValue={MOCK_SALES_OVERVIEW.discounts}
              currency="FCFA"
              hint="Packs quantité & coupons"
              icon={Percent}
            />

            <StatCard
              id="stat-card-returns"
              label="Retours / Rejets"
              numericValue={MOCK_SALES_OVERVIEW.returns}
              currency="FCFA"
              hint="Colis refusés à l'arrivée"
              icon={RotateCcw}
            />

            <StatCard
              id="stat-card-net-sales"
              label="Ventes Nettes"
              numericValue={MOCK_SALES_OVERVIEW.netSales}
              currency="FCFA"
              hint="CA réel encaissé en espèces"
              icon={Wallet}
            />

            <StatCard
              id="stat-card-aov"
              label="Panier Moyen (AOV)"
              numericValue={MOCK_SALES_OVERVIEW.averageOrderValue}
              currency="FCFA"
              hint="Visites → Commandes"
              icon={ShoppingCart}
            />
          </StatCardsGrid>

          {/* Ventes par Catégorie & Ventes par Pays */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Ventes par Catégorie */}
            <div className="lg:col-span-6 rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
                Ventes par Catégorie
              </h2>
              <div className="space-y-3">
                {MOCK_SALES_OVERVIEW.salesByCategory.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#111111]">{cat.category}</span>
                      <span className="font-black text-[#111111]">
                        {formatFcfa(cat.revenue)} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-black/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#111111] transition-all"
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#888880] block">
                      {cat.orders} commandes livrées
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ventes par Pays & Ville */}
            <div className="lg:col-span-6 rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-4">
              <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
                Répartition par Pays & Ville
              </h2>
              <div className="space-y-2.5">
                {MOCK_SALES_OVERVIEW.salesByCountry.map((item) => (
                  <div
                    key={item.country}
                    className="p-3 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.flag}</span>
                      <div>
                        <span className="font-bold text-[#111111] block">{item.countryName}</span>
                        <span className="text-[10px] text-[#888880]">
                          {item.orders} commandes · Taux livraison {item.deliveredRate}%
                        </span>
                      </div>
                    </div>
                    <span className="font-black text-xs text-[#111111]">
                      {formatFcfa(item.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tableau des Campagnes UTM */}
          <div className="rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] p-5 sm:p-6 shadow-2xs space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
                  Tableau des Campagnes & Tracking UTM
                </h2>
                <p className="text-xs text-[#666660]">
                  Performance précise de chaque campagne publicitaire, coût d'acquisition et retour sur investissement publicitaire (ROAS).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/[0.08] text-[10px] font-bold uppercase tracking-wider text-[#666660]">
                    <th className="py-2.5 pl-2">Campagne UTM</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Visiteurs</th>
                    <th className="py-2.5 px-3">Commandes</th>
                    <th className="py-2.5 px-3">Taux Conv.</th>
                    <th className="py-2.5 px-3">CA Encaissé</th>
                    <th className="py-2.5 px-3">Budget Pub</th>
                    <th className="py-2.5 pr-2 text-right">ROAS Réel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {MOCK_UTM_CAMPAIGNS.map((camp) => (
                    <tr key={camp.campaign} className="hover:bg-black/[0.015]">
                      <td className="py-3 pl-2 font-mono font-bold text-[#111111]">
                        {camp.campaign}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/[0.05] text-[#111111]">
                          {camp.source}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-[#666660]">{camp.visitors.toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-[#111111]">{camp.orders}</td>
                      <td className="py-3 px-3 font-medium text-emerald-700">{camp.conversionRate}%</td>
                      <td className="py-3 px-3 font-bold text-[#111111]">{formatFcfa(camp.revenue)}</td>
                      <td className="py-3 px-3 font-mono text-rose-600">{formatFcfa(camp.adSpend)}</td>
                      <td className="py-3 pr-2 text-right font-black text-emerald-700">
                        {camp.roas}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 2 : RAPPORT DE CLOSING */}
      {activeTab === "closing" && (
        <div className="space-y-6">
          <div className="p-5 rounded-[24px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs">
            <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
              Performance de l'Équipe de Closing WhatsApp
            </h2>
            <p className="text-xs text-[#666660] mt-0.5">
              Suivi individuel des closeuses : taux de confirmation par appel/message et taux de livraison finale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_CLOSING_STATS.map((closer, idx) => (
              <div
                key={closer.closerId}
                className="rounded-[22px] border border-black/[0.08] bg-[#FAF8F5] p-5 shadow-2xs space-y-4 relative overflow-hidden"
              >
                {idx === 0 && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    🏆 Top Closer
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-bold text-sm">
                    {closer.closerName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[#111111]">{closer.closerName}</h3>
                    <span className="text-[10px] text-[#888880]">Closeuse Spécialiste</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-black/[0.06]">
                    <span className="text-[10px] text-[#888880] block">Confirmation</span>
                    <span className="text-base font-black text-emerald-700">
                      {closer.confirmationRate}%
                    </span>
                    <span className="text-[9px] text-[#888880] block mt-0.5">
                      {closer.confirmedOrders}/{closer.assignedOrders} confirmées
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-black/[0.06]">
                    <span className="text-[10px] text-[#888880] block">Livraison Réelle</span>
                    <span className="text-base font-black text-emerald-700">
                      {closer.deliveryRate}%
                    </span>
                    <span className="text-[9px] text-[#888880] block mt-0.5">
                      {closer.deliveredOrders} colis livrés
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-black/[0.06] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#888880] uppercase font-bold">
                    CA Livré Encaissé
                  </span>
                  <span className="font-black text-[#111111]">
                    {formatFcfa(closer.deliveredRevenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENU ONGLET 3 : LIVE (VISITEURS EN DIRECT) */}
      {activeTab === "live" && (
        <div className="space-y-6">
          <div className="p-6 rounded-[26px] border border-black/[0.08] bg-[#FAF8F5] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h2 className="text-sm font-black text-[#111111] uppercase tracking-wide">
                  Activité en Temps Réel
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                Rafraîchi il y a 2 secondes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880]">
                  Visiteurs Actuels sur la Boutique
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#111111]">
                  {MOCK_LIVE_STATS.currentVisitors}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block">
                  En train de consulter une offre
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880]">
                  Paniers / Sélections Actives
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#111111]">
                  {MOCK_LIVE_STATS.activeCarts}
                </div>
                <span className="text-[10px] text-[#666660] font-medium block">
                  Pack choisi par le client
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-black/[0.06] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880]">
                  Formulaires COD en Saisie
                </span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-600">
                  {MOCK_LIVE_STATS.checkoutsInProgress}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold block">
                  Commandes imminentes
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-black/[0.06]">
              <span className="text-xs font-bold text-[#111111] uppercase tracking-wider block mb-2">
                Répartition Géographique Live
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {MOCK_LIVE_STATS.liveLocations.map((loc) => (
                  <div
                    key={loc.city}
                    className="p-3 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between"
                  >
                    <span className="font-bold text-[#111111]">{loc.city}</span>
                    <span className="font-black text-xs text-emerald-700">{loc.count} en ligne</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
