"use client";

import React, { useState } from "react";
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
import {
  MOCK_SALES_OVERVIEW,
  MOCK_CLOSING_STATS,
  MOCK_UTM_CAMPAIGNS,
  MOCK_LIVE_STATS,
} from "@/mock-data/stats";
import { formatFcfa } from "@/lib/money";
import { cn } from "@/lib/utils";

interface StatsClientProps {
  storeSlug: string;
}

export function StatsClient({ storeSlug }: StatsClientProps) {
  const [activeTab, setActiveTab] = useState<"sales" | "closing" | "live">("sales");

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
              formattedValue="4 250 000"
              compactValue="4,25 M"
              currency="FCFA"
              hint="Avant déductions"
              delta={{
                value: 15.2,
                upIsGood: true,
              }}
              icon={ShoppingBag}
              sparkline={[310, 340, 390, 380, 410, 400, 425]}
            />

            <StatCard
              id="stat-card-discounts"
              label="Remises Offertes"
              numericValue={MOCK_SALES_OVERVIEW.discounts}
              formattedValue="180 000"
              compactValue="180 k"
              currency="FCFA"
              hint="Packs quantité & coupons"
              delta={{
                value: -3.1,
                upIsGood: false,
              }}
              icon={Percent}
              sparkline={[22, 20, 19, 18, 19, 17, 18]}
            />

            <StatCard
              id="stat-card-returns"
              label="Retours / Rejets"
              numericValue={MOCK_SALES_OVERVIEW.returns}
              formattedValue="220 000"
              compactValue="220 k"
              currency="FCFA"
              hint="Colis refusés à l'arrivée"
              delta={{
                value: -1.8,
                upIsGood: false,
              }}
              icon={RotateCcw}
              sparkline={[28, 25, 26, 24, 25, 23, 22]}
            />

            <StatCard
              id="stat-card-net-sales"
              label="Ventes Nettes"
              numericValue={MOCK_SALES_OVERVIEW.netSales}
              formattedValue="3 850 000"
              compactValue="3,85 M"
              currency="FCFA"
              hint="CA réel encaissé en espèces"
              delta={{
                value: 18.5,
                upIsGood: true,
              }}
              icon={Wallet}
              sparkline={[260, 290, 340, 330, 365, 355, 385]}
            />

            <StatCard
              id="stat-card-aov"
              label="Panier Moyen (AOV)"
              numericValue={MOCK_SALES_OVERVIEW.averageOrderValue}
              formattedValue="31 050"
              compactValue="31,1 k"
              currency="FCFA"
              hint="Visites → Commandes"
              delta={{
                value: 12.0,
                upIsGood: true,
              }}
              icon={ShoppingCart}
              sparkline={[26, 27, 28, 29, 30, 30, 31]}
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
