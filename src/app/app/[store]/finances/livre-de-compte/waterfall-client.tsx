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

  // Données réelles : à 0 tant qu'aucune commande n'est enregistrée (plus de chiffres de démonstration)
  const pctOf = (part: number, total: number) => (total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0);
  const financialData = useMemo(() => {
    const grossRevenue = 0;
    const productCost = 0;
    const grossMargin = grossRevenue - productCost;
    const shippingFees = 0;
    const packagingFees = 0;
    const adSpend = 0;
    const variableMargin = grossMargin - (shippingFees + packagingFees + adSpend);
    const fixedOperatingCosts = 0;
    const vatLine = 0;
    const netProfit = variableMargin - fixedOperatingCosts - vatLine;
    const prevGrossRevenue = 0;
    const prevNetProfit = 0;

    return {
      grossRevenue,
      productCost,
      grossMargin,
      grossMarginPct: pctOf(grossMargin, grossRevenue),
      shippingFees,
      packagingFees,
      adSpend,
      variableMargin,
      variableMarginPct: pctOf(variableMargin, grossRevenue),
      fixedOperatingCosts,
      vatLine,
      netProfit,
      netProfitPct: pctOf(netProfit, grossRevenue),
      prevGrossRevenue,
      prevNetProfit,
      revGrowth: 0,
      profitGrowth: 0,
    };
  }, []);

  // Entonnoir des commandes (vide tant qu'il n'y a pas de commandes réelles)
  const funnel: { step: string; count: number; pct: string; drop: string | null }[] = [];

  // 12 mois glissants (vide tant qu'il n'y a pas d'historique réel)
  const rolling12Months: { month: string; revenue: number; profit: number; margin: number }[] = [];

  // Export CSV
  const handleExportFinancials = () => {
    const csvContent =
      "Ligne,Montant_XOF,Pourcentage_CA\n" +
      `"1. Chiffre d'Affaires Brut Encaissé",${financialData.grossRevenue},100%\n` +
      `"2. Coût des Marchandises Vendues (COGS)",-${financialData.productCost},${pctOf(financialData.productCost, financialData.grossRevenue)}%\n` +
      `"= Marge Brute",${financialData.grossMargin},${financialData.grossMarginPct}%\n` +
      `"3. Frais de Livraison Payés",-${financialData.shippingFees},${pctOf(financialData.shippingFees, financialData.grossRevenue)}%\n` +
      `"4. Emballage & Consommables",-${financialData.packagingFees},${pctOf(financialData.packagingFees, financialData.grossRevenue)}%\n` +
      `"5. Dépenses Publicitaires (Ads)",-${financialData.adSpend},${pctOf(financialData.adSpend, financialData.grossRevenue)}%\n` +
      `"= Marge Nette Variable",${financialData.variableMargin},${financialData.variableMarginPct}%\n` +
      `"6. Charges Fixes d'Exploitation",-${financialData.fixedOperatingCosts},${pctOf(financialData.fixedOperatingCosts, financialData.grossRevenue)}%\n` +
      `"7. Provision TVA",-${financialData.vatLine},${pctOf(financialData.vatLine, financialData.grossRevenue)}%\n` +
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
                  ? "bg-[#1F3A26] text-[#FAF8F5] shadow-xs"
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
                  ? "bg-[#1F3A26] text-[#FAF8F5] shadow-xs"
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
                  ? "bg-[#1F3A26] text-[#FAF8F5] shadow-xs"
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
                  ? "bg-[#1F3A26] text-[#FAF8F5] shadow-xs"
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
            currency="FCFA"
            hint="Commandes passées & livrées"
            delta={{
              value: financialData.revGrowth,
              upIsGood: true,
            }}
            icon={Wallet}
          />

          <StatCard
            id="stat-card-waterfall-cogs"
            label="Coût Marchandises"
            numericValue={financialData.productCost}
            currency="FCFA"
            hint="COGS & approche"
            icon={Package}
          />

          <StatCard
            id="stat-card-waterfall-gross-margin"
            label="Marge Commerciale"
            numericValue={financialData.grossMargin}
            currency="FCFA"
            hint={`${financialData.grossMarginPct} % du CA brut`}
            icon={TrendingUp}
          />

          <StatCard
            id="stat-card-waterfall-operating-costs"
            label="Frais Opérationnels"
            numericValue={financialData.shippingFees + financialData.packagingFees + financialData.adSpend}
            currency="FCFA"
            hint="Pub, livraison & logistique"
            icon={Truck}
          />

          <StatCard
            id="stat-card-waterfall-net-profit"
            label="Bénéfice Net en Poche"
            numericValue={financialData.netProfit}
            currency="FCFA"
            hint={`${financialData.netProfitPct} % de marge nette`}
            delta={{
              value: financialData.profitGrowth,
              upIsGood: true,
            }}
            icon={DollarSign}
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
            <div className="flex items-center justify-between p-5 rounded-3xl bg-[#1F3A26] text-[#FAF8F5] shadow-lg font-sans">
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
                  <span className="h-6 w-6 rounded-full bg-[#1F3A26] text-white flex items-center justify-center font-bold text-[10px]">
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
