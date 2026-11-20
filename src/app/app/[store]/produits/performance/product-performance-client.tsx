"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Clock,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Package,
  Calendar,
  Lock,
} from "lucide-react";
import { ProductsNavTabs } from "@/components/products/products-nav-tabs";
import { useApp } from "@/components/layout/app-shell";
import { canViewProductFinancials } from "@/config/permissions";
import { getShopProductsRaw } from "@/lib/products-store";
import { MOCK_ORDERS } from "@/mock-data/orders";
import { formatFcfa } from "@/lib/money";
import {
  calculateProductIndicators,
  IndicatorPeriod,
  ProductDashboardIndicators,
} from "@/lib/product-indicators";
import { Order, Product } from "@/server/data/types";

interface ProductPerformanceClientProps {
  storeSlug: string;
}

export function ProductPerformanceClient({ storeSlug }: ProductPerformanceClientProps) {
  const { activeRole } = useApp();
  const isFounderDemoStore = storeSlug === "lome-glow";
  const canSeeFinancials = canViewProductFinancials(activeRole);

  const [period, setPeriod] = useState<IndicatorPeriod>("30d");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prods = getShopProductsRaw(storeSlug);
      setProducts(prods);

      let ords: Order[] = [];
      const savedOrders = localStorage.getItem(`novika_store_orders_${storeSlug}`);
      if (savedOrders) {
        try {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed)) ords = parsed;
        } catch {}
      }
      if (ords.length === 0 && isFounderDemoStore) {
        ords = MOCK_ORDERS;
      }
      setOrders(ords);
    }
  }, [storeSlug, isFounderDemoStore]);

  const indicators: ProductDashboardIndicators = useMemo(() => {
    return calculateProductIndicators(products, orders, period);
  }, [products, orders, period]);

  const periodLabels: { id: IndicatorPeriod; label: string }[] = [
    { id: "today", label: "Aujourd'hui" },
    { id: "7d", label: "7 derniers jours" },
    { id: "30d", label: "30 derniers jours" },
    { id: "90d", label: "90 derniers jours" },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-24 text-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <ProductsNavTabs storeSlug={storeSlug} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              Performance Produit
            </h1>
            <p className="text-sm text-[#7A7A7A] mt-1">
              Indicateurs de vente, vélocité de stock et classification ABC basés sur les commandes livrées.
            </p>
          </div>

          {/* Sélecteur de période */}
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#E6E0D4] rounded-xl shadow-xs overflow-x-auto">
            {periodLabels.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  period === p.id
                    ? "bg-[#111111] text-white shadow-xs"
                    : "text-[#666666] hover:text-[#111111] hover:bg-[#F3EFE6]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Cartes Principales d'indicateurs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* 1. Taux de vente moyen */}
          <div className="bg-white rounded-2xl border border-[#E6E0D4] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A]">
                  Vélocité d'écoulement
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <TrendingUp className="w-5 h-5" />
                </span>
              </div>
              <h2 className="text-sm font-medium text-[#4A4A4A]">Taux de vente moyen</h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#111111]">
                  {indicators.sellThrough.hasData
                    ? indicators.sellThrough.formattedRate
                    : "Aucune donnée"}
                </span>
              </div>
              <p className="text-xs text-[#7A7A7A] mt-2">
                {indicators.sellThrough.hasData
                  ? `${indicators.sellThrough.totalSoldUnits} unités livrées · ${indicators.sellThrough.totalRemainingStock} en stock restant`
                  : "Aucune commande livrée sur cette période"}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F0EBE0] text-xs text-[#888888] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#AAAAAA] shrink-0" />
              <span>Unités vendues ÷ (unités vendues + stock restant)</span>
            </div>
          </div>

          {/* 2. Jours de stock restants */}
          <div className="bg-white rounded-2xl border border-[#E6E0D4] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A]">
                  Alerte Rupture
                </span>
                <span className={`p-2 rounded-xl ${indicators.runway.criticalCount > 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                  <Clock className="w-5 h-5" />
                </span>
              </div>
              <h2 className="text-sm font-medium text-[#4A4A4A]">Jours de stock restants</h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-[#111111]">
                  {indicators.runway.hasData
                    ? indicators.runway.summaryText
                    : "Aucune donnée"}
                </span>
              </div>
              <p className="text-xs text-[#7A7A7A] mt-2">
                {indicators.runway.hasData
                  ? `${indicators.runway.criticalCount} critique (< 7 j) · ${indicators.runway.warningCount} modéré (7-15 j)`
                  : "Pas de rythme de vente mesurable"}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F0EBE0] text-xs text-[#888888] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#AAAAAA] shrink-0" />
              <span>Stock disponible ÷ ventes moyennes livrées par jour</span>
            </div>
          </div>

          {/* 3. Analyse ABC */}
          <div className="bg-white rounded-2xl border border-[#E6E0D4] p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#7A7A7A]">
                  Répartition Pareto
                </span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Layers className="w-5 h-5" />
                </span>
              </div>
              <h2 className="text-sm font-medium text-[#4A4A4A]">Analyse ABC (CA livré)</h2>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-[#111111]">
                  {indicators.abc.hasData ? indicators.abc.summaryText : "Aucune donnée"}
                </span>
              </div>
              <p className="text-xs text-[#7A7A7A] mt-2">
                {indicators.abc.hasData
                  ? canSeeFinancials
                    ? `CA Total livré : ${formatFcfa(indicators.abc.totalRevenue)}`
                    : "Classement établi sur les commandes livrées"
                  : "Aucune vente livrée enregistrée"}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#F0EBE0] text-xs text-[#888888] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#AAAAAA] shrink-0" />
              <span>Classe A (80% CA) · Classe B (15% CA) · Classe C (5% CA)</span>
            </div>
          </div>
        </div>

        {/* Détails : Produits en alerte critique (< 7 jours) */}
        {indicators.runway.hasData && indicators.runway.criticalProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E6E0D4] p-6 shadow-sm mb-8">
            <div className="flex items-center gap-2 mb-4 text-red-700 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Produits en alerte de réapprovisionnement imminent (&lt; 7 jours de stock)</span>
            </div>
            <div className="divide-y divide-[#E6E0D4]">
              {indicators.runway.criticalProducts.map((p) => (
                <div key={p.productId} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-[#111111]">{p.name}</p>
                    <p className="text-xs text-[#7A7A7A]">
                      Stock actuel : <span className="font-medium text-[#111111]">{p.stock}</span> · Ventes moyennes :{" "}
                      <span className="font-medium text-[#111111]">{p.avgDailySales} u/j</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      {p.daysRemaining} jour{p.daysRemaining > 1 ? "s" : ""} restant{p.daysRemaining > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Détails : Top produits Classe A */}
        {indicators.abc.hasData && indicators.abc.topAProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E6E0D4] p-6 shadow-sm">
            <h3 className="font-bold text-base text-[#111111] mb-4">
              Top Produits « Classe A » (génèrent 80 % du chiffre d'affaires)
            </h3>
            <div className="divide-y divide-[#E6E0D4]">
              {indicators.abc.topAProducts.map((item) => (
                <div key={item.productId} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 mr-2">
                      A
                    </span>
                    <span className="font-semibold text-sm text-[#111111]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    {canSeeFinancials ? (
                      <p className="text-sm font-bold text-[#111111]">{formatFcfa(item.revenue)}</p>
                    ) : (
                      <p className="text-xs text-[#7A7A7A] italic">Masqué (droits)</p>
                    )}
                    <p className="text-xs text-[#7A7A7A]">Part cumulée : {item.cumulatedShare}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
