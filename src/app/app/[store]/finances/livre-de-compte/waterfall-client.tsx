"use client";

import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Truck,
  Package,
  Megaphone,
  CreditCard,
  Building2,
  Percent,
  CheckCircle2,
  PieChart,
  BarChart3,
  Filter,
  Wallet,
} from "lucide-react";
import { StatCard, StatCardsGrid } from "@/components/app/stat-card";
import { PageHeader } from "@/components/app/page-header";
import { FinancesNavTabs } from "@/components/finances/finances-nav-tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CountryChip } from "@/components/app/bits";
import { formatMoney } from "@/lib/currencies";
import { cn } from "@/lib/utils";

interface WaterfallClientProps {
  storeSlug: string;
}

export function WaterfallClient({ storeSlug }: WaterfallClientProps) {
  const [levelFilter, setLevelFilter] = useState<"all_org" | "country" | "store" | "product">("all_org");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");

  // Données de cascade financière (exprimées en entiers subunits XOF)
  const financialData = useMemo(() => {
    // Période courante
    const grossRevenue = 15420000; // 15 420 000 XOF
    const productCost = 4120000; // 4 120 000 XOF (COGS)
    const grossMargin = grossRevenue - productCost; // 11 300 000 XOF (73.3%)

    const shippingFees = 1450000; // 1 450 000 XOF (Frais payés aux livreurs)
    const packagingFees = 380000; // 380 000 XOF (Cartons, rubans)
    const adSpend = 2450000; // 2 450 000 XOF (Meta, TikTok, Google)
    const variableMargin = grossMargin - (shippingFees + packagingFees + adSpend); // 7 020 000 XOF (45.5%)

    const fixedOperatingCosts = 850000; // 850 000 XOF (Loyer, abonnements, téléphone)
    const vatLine = 720000; // 720 000 XOF (TVA locale)
    const netProfit = variableMargin - fixedOperatingCosts - vatLine; // 5 450 000 XOF (35.3%)

    // Période précédente de même durée (pour comparaison A/B)
    const prevGrossRevenue = 12400000;
    const prevNetProfit = 3980000;

    const revGrowth = Number((((grossRevenue - prevGrossRevenue) / prevGrossRevenue) * 100).toFixed(1));
    const profitGrowth = Number((((netProfit - prevNetProfit) / prevNetProfit) * 100).toFixed(1));

    return {
      grossRevenue,
      productCost,
      grossMargin,
      grossMarginPct: Number(((grossMargin / grossRevenue) * 100).toFixed(1)),
      shippingFees,
      packagingFees,
      adSpend,
      variableMargin,
      variableMarginPct: Number(((variableMargin / grossRevenue) * 100).toFixed(1)),
      fixedOperatingCosts,
      vatLine,
      netProfit,
      netProfitPct: Number(((netProfit / grossRevenue) * 100).toFixed(1)),
      prevGrossRevenue,
      prevNetProfit,
      revGrowth,
      profitGrowth,
    };
  }, []);

  // Entonnoir des Commandes
  const funnel = [
    { step: "Commandes reçues", count: 986, pct: "100%", drop: null },
    { step: "Confirmées par closeuses", count: 864, pct: "87.6%", drop: "-12.4% annulations" },
    { step: "Programmées & Expédiées", count: 812, pct: "82.3%", drop: "-5.3% reports" },
    { step: "Livrées en mains propres", count: 684, pct: "69.4%", drop: "-12.9% échecs/refus" },
    { step: "Encaissées 100% en espèces", count: 684, pct: "69.4%", drop: "0% litiges" },
  ];

  // 12 Mois Glissants (Historique)
  const rolling12Months = [
    { month: "Déc 25", revenue: 9800000, profit: 3100000, margin: 31.6 },
    { month: "Jan 26", revenue: 10400000, profit: 3450000, margin: 33.1 },
    { month: "Fév 26", revenue: 11200000, profit: 3800000, margin: 33.9 },
    { month: "Mar 26", revenue: 12100000, profit: 4100000, margin: 33.8 },
    { month: "Avr 26", revenue: 11800000, profit: 3950000, margin: 33.4 },
    { month: "Mai 26", revenue: 13200000, profit: 4600000, margin: 34.8 },
    { month: "Juin 26", revenue: 14100000, profit: 4900000, margin: 34.7 },
    { month: "Juil 26", revenue: 13900000, profit: 4750000, margin: 34.1 },
    { month: "Août 26", revenue: 12800000, profit: 4300000, margin: 33.5 },
    { month: "Sept 26", revenue: 14600000, profit: 5100000, margin: 34.9 },
    { month: "Oct 26", revenue: 15100000, profit: 5350000, margin: 35.4 },
    { month: "Nov 26", revenue: 15420000, profit: 5450000, margin: 35.3 },
  ];

  // Export CSV
  const handleExportFinancials = () => {
    const csvContent =
      "Ligne,Montant_XOF,Pourcentage_CA\n" +
      `"1. Chiffre d'Affaires Brut Encaissé",${financialData.grossRevenue},100%\n` +
      `"2. Coût des Marchandises Vendues (COGS)",-${financialData.productCost},${((financialData.productCost / financialData.grossRevenue) * 100).toFixed(1)}%\n` +
      `"= Marge Brute",${financialData.grossMargin},${financialData.grossMarginPct}%\n` +
      `"3. Frais de Livraison Payés",-${financialData.shippingFees},${((financialData.shippingFees / financialData.grossRevenue) * 100).toFixed(1)}%\n` +
      `"4. Emballage & Consommables",-${financialData.packagingFees},${((financialData.packagingFees / financialData.grossRevenue) * 100).toFixed(1)}%\n` +
      `"5. Dépenses Publicitaires (Ads)",-${financialData.adSpend},${((financialData.adSpend / financialData.grossRevenue) * 100).toFixed(1)}%\n` +
      `"= Marge Nette Variable",${financialData.variableMargin},${financialData.variableMarginPct}%\n` +
      `"6. Charges Fixes d'Exploitation",-${financialData.fixedOperatingCosts},${((financialData.fixedOperatingCosts / financialData.grossRevenue) * 100).toFixed(1)}%\n` +
      `"7. Provision TVA",-${financialData.vatLine},${((financialData.vatLine / financialData.grossRevenue) * 100).toFixed(1)}%\n` +
      `"= BÉNÉFICE NET EN POCHE",${financialData.netProfit},${financialData.netProfitPct}%\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compte_de_resultat_${storeSlug}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Navigation Onglets Finances */}
      <FinancesNavTabs storeSlug={storeSlug} />

      {/* En-tête */}
      <ScrollReveal delay={0}>
        <PageHeader
          title="Livre des Comptes & Cascade Financière"
          description="Compte de résultat réel décomposé : du chiffre d'affaires encaissé au bénéfice net réel en poche après déduction des coûts variables, fixes et de la TVA."
          actions={
            <div className="flex items-center gap-2">
              <DateRangePicker align="right" />
              <button
                type="button"
                onClick={handleExportFinancials}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exporter le Compte de Résultat</span>
              </button>
            </div>
          }
        />
      </ScrollReveal>

      {/* Sélecteur de Niveau Hiérarchique (Organisation -> Pays -> Boutique -> Produit) */}
      <ScrollReveal delay={40}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-black/[0.08] bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#111111]" />
            <span className="text-xs font-black uppercase tracking-wider text-[#111111]">
              Périmètre d'analyse :
            </span>
          </div>

          <div className="inline-flex rounded-xl border border-black/[0.08] bg-white p-1">
            <button
              type="button"
              onClick={() => setLevelFilter("all_org")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                levelFilter === "all_org"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              Toute l'organisation
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("country")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                levelFilter === "country"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              Par pays
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("store")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                levelFilter === "store"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              Par boutique
            </button>
            <button
              type="button"
              onClick={() => setLevelFilter("product")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                levelFilter === "product"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "text-[#666660] hover:text-[#111111]"
              )}
            >
              Par produit
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* SÉLECTION RAPIDE DES 5 KPI DU COMPTE DE RÉSULTAT */}
      <ScrollReveal delay={50}>
        <StatCardsGrid id="waterfall-stat-cards-grid">
          <StatCard
            id="stat-card-waterfall-gross"
            label="CA Brut Encaissé"
            numericValue={financialData.grossRevenue}
            formattedValue="15 420 000"
            compactValue="15,4 M"
            currency="FCFA"
            hint="Commandes passées & livrées"
            delta={{
              value: financialData.revGrowth,
              upIsGood: true,
            }}
            icon={Wallet}
            sparkline={[980, 1040, 1120, 1210, 1320, 1460, 1542]}
          />

          <StatCard
            id="stat-card-waterfall-cogs"
            label="Coût Marchandises"
            numericValue={financialData.productCost}
            formattedValue="4 120 000"
            compactValue="4,12 M"
            currency="FCFA"
            hint="COGS & approche"
            delta={{
              value: -3.2,
              upIsGood: false,
            }}
            icon={Package}
            sparkline={[290, 310, 330, 350, 370, 395, 412]}
          />

          <StatCard
            id="stat-card-waterfall-gross-margin"
            label="Marge Commerciale"
            numericValue={financialData.grossMargin}
            formattedValue="11 300 000"
            compactValue="11,3 M"
            currency="FCFA"
            hint={`${financialData.grossMarginPct} % du CA brut`}
            delta={{
              value: 16.8,
              upIsGood: true,
            }}
            icon={TrendingUp}
            sparkline={[690, 730, 790, 860, 950, 1065, 1130]}
          />

          <StatCard
            id="stat-card-waterfall-operating-costs"
            label="Frais Opérationnels"
            numericValue={financialData.shippingFees + financialData.packagingFees + financialData.adSpend}
            formattedValue="4 280 000"
            compactValue="4,28 M"
            currency="FCFA"
            hint="Pub, livraison & logistique"
            delta={{
              value: -5.1,
              upIsGood: false,
            }}
            icon={Truck}
            sparkline={[320, 340, 360, 380, 400, 415, 428]}
          />

          <StatCard
            id="stat-card-waterfall-net-profit"
            label="Bénéfice Net en Poche"
            numericValue={financialData.netProfit}
            formattedValue="5 450 000"
            compactValue="5,45 M"
            currency="FCFA"
            hint={`${financialData.netProfitPct} % de marge nette`}
            delta={{
              value: financialData.profitGrowth,
              upIsGood: true,
            }}
            icon={DollarSign}
            sparkline={[310, 345, 380, 410, 460, 510, 545]}
          />
        </StatCardsGrid>
      </ScrollReveal>

      {/* CASCADE FINANCIÈRE EN CARTE MAÎTRESSE */}
      <ScrollReveal delay={60}>
        <div className="rounded-3xl border border-black/[0.1] bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.08] pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#666660]">
                Cascade Financière & Rentabilité Réelle
              </span>
              <h2 className="text-xl font-black text-[#111111]">
                Compte de Résultat Simplifié COD
              </h2>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Bénéfice net : {financialData.netProfitPct}% du CA
              </span>
              <span className="text-[#666660]">
                vs période précédente : +{financialData.profitGrowth}%
              </span>
            </div>
          </div>

          {/* Lignes de la cascade financière */}
          <div className="space-y-3 font-mono text-xs">
            {/* 1. CA Brut Encaissé */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <div className="flex items-center gap-2.5 font-sans">
                <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  1
                </div>
                <div>
                  <p className="font-black text-sm text-[#111111]">
                    Chiffre d'Affaires Brut Encaissé
                  </p>
                  <p className="text-[11px] text-[#666660]">
                    Commandes livrées et payées en espèces aux livreurs
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-emerald-800">
                  +{formatMoney(financialData.grossRevenue, "XOF")}
                </span>
                <span className="text-[10px] text-[#888880] block">100.0% du CA</span>
              </div>
            </div>

            {/* 2. Coût des marchandises vendues (COGS) */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-black/[0.06]">
              <div className="flex items-center gap-2.5 font-sans">
                <div className="h-7 w-7 rounded-lg bg-[#E5DEC9] text-[#111111] flex items-center justify-center font-black text-xs">
                  2
                </div>
                <div>
                  <p className="font-bold text-sm text-[#111111]">
                    Coût des Marchandises Vendues (COGS / PUMP)
                  </p>
                  <p className="text-[11px] text-[#666660]">
                    Prix d'achat unitaire fournisseur et quote-part frais d'approche
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-rose-700">
                  -{formatMoney(financialData.productCost, "XOF")}
                </span>
                <span className="text-[10px] text-[#888880] block">26.7% du CA</span>
              </div>
            </div>

            {/* SOUS-TOTAL : MARGE BRUTE */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/[0.03] border-l-4 border-l-emerald-600 font-sans">
              <span className="font-black text-xs text-[#111111] uppercase tracking-wider">
                = Marge Brute Commerciale
              </span>
              <div className="text-right font-mono">
                <span className="font-black text-sm text-[#111111]">
                  {formatMoney(financialData.grossMargin, "XOF")}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 block">
                  {financialData.grossMarginPct}% de marge brute
                </span>
              </div>
            </div>

            {/* 3. Frais de Livraison */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/[0.06]">
              <div className="flex items-center gap-2 font-sans">
                <Truck className="h-4 w-4 text-[#888880]" />
                <span className="font-bold text-[#111111]">
                  Frais de Livraison aux Partenaires (Courses)
                </span>
              </div>
              <span className="font-black text-rose-700">
                -{formatMoney(financialData.shippingFees, "XOF")}
              </span>
            </div>

            {/* 4. Emballages & Colisage */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/[0.06]">
              <div className="flex items-center gap-2 font-sans">
                <Package className="h-4 w-4 text-[#888880]" />
                <span className="font-bold text-[#111111]">
                  Emballage, Cartons & Pochettes Sécurisées
                </span>
              </div>
              <span className="font-black text-rose-700">
                -{formatMoney(financialData.packagingFees, "XOF")}
              </span>
            </div>

            {/* 5. Dépenses Publicitaires */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/[0.06]">
              <div className="flex items-center gap-2 font-sans">
                <Megaphone className="h-4 w-4 text-[#888880]" />
                <span className="font-bold text-[#111111]">
                  Publicité (Meta Ads, TikTok, Google)
                </span>
              </div>
              <span className="font-black text-rose-700">
                -{formatMoney(financialData.adSpend, "XOF")}
              </span>
            </div>

            {/* SOUS-TOTAL : MARGE VARIABLE NETTE */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/[0.03] border-l-4 border-l-blue-600 font-sans">
              <span className="font-black text-xs text-[#111111] uppercase tracking-wider">
                = Marge Nette sur Coûts Variables
              </span>
              <div className="text-right font-mono">
                <span className="font-black text-sm text-[#111111]">
                  {formatMoney(financialData.variableMargin, "XOF")}
                </span>
                <span className="text-[10px] font-bold text-blue-700 block">
                  {financialData.variableMarginPct}% du CA
                </span>
              </div>
            </div>

            {/* 6. Charges d'Exploitation & 7. TVA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/[0.06]">
                <div className="flex items-center gap-2 font-sans">
                  <Building2 className="h-4 w-4 text-[#888880]" />
                  <span className="font-bold text-[#111111]">Charges Fixes (Loyers, SaaS)</span>
                </div>
                <span className="font-black text-rose-700">
                  -{formatMoney(financialData.fixedOperatingCosts, "XOF")}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/[0.06]">
                <div className="flex items-center gap-2 font-sans">
                  <Percent className="h-4 w-4 text-[#888880]" />
                  <span className="font-bold text-[#111111]">Ligne TVA & Taxes Locales</span>
                </div>
                <span className="font-black text-rose-700">
                  -{formatMoney(financialData.vatLine, "XOF")}
                </span>
              </div>
            </div>

            {/* TOTAL FINAL : BÉNÉFICE NET EN POCHE */}
            <div className="flex items-center justify-between p-5 rounded-3xl bg-[#111111] text-[#FAF8F5] shadow-lg font-sans">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  RÉSULTAT NET RÉEL EN POCHE
                </span>
                <p className="text-xs text-[#FAF8F5]/70 mt-0.5">
                  Bénéfice net après déduction intégrale des coûts
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  {formatMoney(financialData.netProfit, "XOF")}
                </span>
                <span className="text-xs font-bold text-white/80 block mt-0.5">
                  Marge Nette Réelle : {financialData.netProfitPct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* ENTONNOIR DES COMMANDES COD */}
      <ScrollReveal delay={90}>
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-[#111111]">
              Entonnoir de Conversion des Commandes COD
            </h3>
            <span className="text-xs text-[#666660]">De la visite à l'encaissement</span>
          </div>

          <div className="space-y-2.5">
            {funnel.map((item, idx) => (
              <div
                key={item.step}
                className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="h-6 w-6 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-[#111111]">{item.step}</span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-black text-sm text-[#111111]">{item.count} commandes</span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {item.pct}
                  </span>
                  {item.drop && (
                    <span className="text-[11px] text-rose-600 font-semibold">{item.drop}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* HISTORIQUE 12 MOIS GLISSANTS */}
      <ScrollReveal delay={120}>
        <div className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base text-[#111111]">
              Évolution sur 12 Mois Glissants
            </h3>
            <span className="text-xs text-[#666660]">CA Brut vs Résultat Net Réalisé</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-black/[0.06] text-[#666660] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Mois</th>
                  <th className="py-2.5 px-3 text-right">CA Brut Encaissé</th>
                  <th className="py-2.5 px-3 text-right">Bénéfice Net</th>
                  <th className="py-2.5 px-3 text-right">Marge Nette %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {rolling12Months.map((m) => (
                  <tr key={m.month} className="hover:bg-[#FAF8F5]/60 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#111111]">{m.month}</td>
                    <td className="py-2.5 px-3 text-right font-black text-[#111111]">
                      {formatMoney(m.revenue, "XOF")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                      {formatMoney(m.profit, "XOF")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#111111]">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {m.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
