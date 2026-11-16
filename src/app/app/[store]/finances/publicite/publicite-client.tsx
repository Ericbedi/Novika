"use client";

import React, { useMemo, useState } from "react";
import {
  Megaphone,
  Plus,
  Upload,
  Download,
  Calendar,
  Search,
  Filter,
  TrendingUp,
  Percent,
  Truck,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
} from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { FinancesNavTabs } from "@/components/finances/finances-nav-tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { CountryChip } from "@/components/app/bits";
import { AdSpendRecord, MOCK_AD_SPEND } from "@/mock-data/advanced-finances";
import { formatMoney } from "@/lib/currencies";
import { cn } from "@/lib/utils";

interface PubliciteClientProps {
  storeSlug: string;
}

export function PubliciteClient({ storeSlug }: PubliciteClientProps) {
  const [adSpends, setAdSpends] = useState<AdSpendRecord[]>(MOCK_AD_SPEND);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Formulaire d'ajout
  const [newPlatform, setNewPlatform] = useState<AdSpendRecord["platform"]>("meta");
  const [newCampaign, setNewCampaign] = useState("");
  const [newCountry, setNewCountry] = useState("CI");
  const [newSpendAmount, setNewSpendAmount] = useState<number>(0);
  const [newDeliveredCount, setNewDeliveredCount] = useState<number>(0);
  const [newDeliveredRev, setNewDeliveredRev] = useState<number>(0);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtrage
  const filteredSpends = useMemo(() => {
    return adSpends.filter((ad) => {
      if (selectedPlatform !== "all" && ad.platform !== selectedPlatform) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ad.campaignName.toLowerCase().includes(q) ||
          ad.platform.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [adSpends, selectedPlatform, searchQuery]);

  // Calculs globaux & CPA Réel
  const metrics = useMemo(() => {
    let totalSpend = 0;
    let totalDeliveredCount = 0;
    let totalDeliveredRevenue = 0;

    const platformTotals: Record<string, { spend: number; revenue: number; deliveries: number }> = {
      meta: { spend: 0, revenue: 0, deliveries: 0 },
      tiktok: { spend: 0, revenue: 0, deliveries: 0 },
      google: { spend: 0, revenue: 0, deliveries: 0 },
      snapchat: { spend: 0, revenue: 0, deliveries: 0 },
    };

    adSpends.forEach((ad) => {
      totalSpend += ad.spendAmount;
      totalDeliveredCount += ad.deliveredOrdersCount;
      totalDeliveredRevenue += ad.deliveredRevenue;

      if (platformTotals[ad.platform]) {
        platformTotals[ad.platform].spend += ad.spendAmount;
        platformTotals[ad.platform].revenue += ad.deliveredRevenue;
        platformTotals[ad.platform].deliveries += ad.deliveredOrdersCount;
      }
    });

    const averageRealCpa = totalDeliveredCount > 0 ? Math.round(totalSpend / totalDeliveredCount) : 0;
    const netRoas = totalSpend > 0 ? Number((totalDeliveredRevenue / totalSpend).toFixed(2)) : 0;

    return {
      totalSpend,
      totalDeliveredCount,
      totalDeliveredRevenue,
      averageRealCpa,
      netRoas,
      platformTotals,
    };
  }, [adSpends]);

  // Ajouter une dépense pub
  const handleAddSpend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.trim() || newSpendAmount <= 0) return;

    const newAd: AdSpendRecord = {
      id: `ad_${Date.now()}`,
      platform: newPlatform,
      campaignName: newCampaign.trim(),
      country: newCountry,
      date: new Date().toLocaleDateString("fr-FR"),
      spendAmount: Math.round(newSpendAmount),
      currency: "XOF",
      deliveredOrdersCount: Math.round(newDeliveredCount),
      deliveredRevenue: Math.round(newDeliveredRev),
      impressions: 10000,
      clicks: 350,
    };

    setAdSpends([newAd, ...adSpends]);
    setIsAddModalOpen(false);
    setNewCampaign("");
    setNewSpendAmount(0);
    setNewDeliveredCount(0);
    setNewDeliveredRev(0);
    showToast("Dépense publicitaire enregistrée avec CPA calculé !");
  };

  // Import CSV simulé
  const handleSimulateCsvImport = () => {
    setIsCsvModalOpen(false);
    showToast("Fichier CSV importé avec succès : 4 campagnes ajoutées !");
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = "Date,Plateforme,Campagne,Pays,Depense_XOF,Livraisons_Reelles,CA_Livre_XOF,CPA_Reel,ROAS_Net\n";
    const rows = filteredSpends
      .map((ad) => {
        const cpa = ad.deliveredOrdersCount > 0 ? Math.round(ad.spendAmount / ad.deliveredOrdersCount) : 0;
        const roas = ad.spendAmount > 0 ? (ad.deliveredRevenue / ad.spendAmount).toFixed(2) : 0;
        return `"${ad.date}","${ad.platform}","${ad.campaignName}","${ad.country}",${ad.spendAmount},${ad.deliveredOrdersCount},${ad.deliveredRevenue},${cpa},${roas}`;
      })
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `publicites_${storeSlug}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast("Export CSV des publicités téléchargé !");
  };

  const getPlatformBadge = (platform: AdSpendRecord["platform"]) => {
    switch (platform) {
      case "meta":
        return { label: "Meta Ads", color: "bg-blue-50 text-blue-800 border-blue-200" };
      case "tiktok":
        return { label: "TikTok Ads", color: "bg-slate-900 text-white border-black" };
      case "google":
        return { label: "Google Ads", color: "bg-amber-50 text-amber-800 border-amber-200" };
      case "snapchat":
        return { label: "Snapchat Ads", color: "bg-yellow-50 text-yellow-900 border-yellow-200" };
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#111111] text-[#FAF8F5] px-4 py-2.5 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Onglets Finances */}
      <FinancesNavTabs storeSlug={storeSlug} />

      {/* En-tête de la page */}
      <ScrollReveal delay={0}>
        <PageHeader
          title="Publicités & CPA réel"
          description="Mesurez la rentabilité nette de vos campagnes publicitaires avec le CPA réel (rapporté aux commandes réellement livrées et encaissées)."
          actions={
            <div className="flex items-center gap-2">
              <DateRangePicker align="right" />
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Exporter (CSV)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-black/[0.08] bg-white text-xs font-bold text-[#111111] hover:bg-[#FAF8F5] transition-all shadow-2xs cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Importer CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#111111] text-xs font-bold text-[#FAF8F5] hover:bg-black transition-all shadow-2xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajouter dépense</span>
              </button>
            </div>
          }
        />
      </ScrollReveal>

      {/* 4 Compteurs Clés : Dépense totale, Livraisons, CPA Réel, ROAS Net */}
      <ScrollReveal delay={50}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Dépense Pub Totale */}
          <div className="rounded-2xl border border-black/[0.08] bg-[#FAF8F5] p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#666660]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Budget Pub Dépensé</span>
              <Megaphone className="h-4 w-4 text-[#111111]" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#111111]">
              {formatMoney(metrics.totalSpend, "XOF")}
            </div>
            <p className="mt-1 text-[11px] text-[#666660]">Toutes plateformes confondues</p>
          </div>

          {/* 2. Commandes Livrées Réelles */}
          <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between text-[#666660]">
              <span className="text-[11px] font-bold uppercase tracking-wider">Commandes Livrées</span>
              <Truck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-black text-[#111111]">
              {metrics.totalDeliveredCount} colis
            </div>
            <p className="mt-1 text-[11px] text-[#666660]">CA livré : {formatMoney(metrics.totalDeliveredRevenue, "XOF")}</p>
          </div>

          {/* 3. CPA Réel Moyen (pub / livrées) */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-blue-900">
              <span className="text-[11px] font-bold uppercase tracking-wider">CPA Réel Moyen</span>
              <Percent className="h-4 w-4 text-blue-700" />
            </div>
            <div className="mt-2 text-2xl font-black text-blue-950">
              {formatMoney(metrics.averageRealCpa, "XOF")}
            </div>
            <p className="mt-1 text-[11px] text-blue-800">Coût d'acquisition par colis livré</p>
          </div>

          {/* 4. ROAS Net */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-900">
              <span className="text-[11px] font-bold uppercase tracking-wider">ROAS Net Livré</span>
              <TrendingUp className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-950">
              {metrics.netRoas}x
            </div>
            <p className="mt-1 text-[11px] text-emerald-800">CA réel livré ÷ Budget dépensé</p>
          </div>
        </div>
      </ScrollReveal>

      {/* Répartition par Plateforme (Part de marché Meta vs TikTok vs Google vs Snapchat) */}
      <ScrollReveal delay={100}>
        <div className="rounded-2xl border border-black/[0.08] bg-white p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#111111]" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-[#111111]">
                Performance & Part par Plateforme Publicitaire
              </h3>
            </div>
            <span className="text-[11px] text-[#666660]">
              Calculé sur les livraisons réelles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {(["meta", "tiktok", "google", "snapchat"] as const).map((plat) => {
              const data = metrics.platformTotals[plat];
              const share = metrics.totalSpend > 0 ? Math.round((data.spend / metrics.totalSpend) * 100) : 0;
              const cpa = data.deliveries > 0 ? Math.round(data.spend / data.deliveries) : 0;
              const roas = data.spend > 0 ? (data.revenue / data.spend).toFixed(2) : "0.00";
              const badge = getPlatformBadge(plat);

              return (
                <div
                  key={plat}
                  onClick={() => setSelectedPlatform(selectedPlatform === plat ? "all" : plat)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer",
                    selectedPlatform === plat
                      ? "border-[#111111] bg-[#FAF8F5] shadow-xs"
                      : "border-black/[0.06] bg-[#FAF8F5]/50 hover:bg-[#FAF8F5]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", badge.color)}>
                      {badge.label}
                    </span>
                    <span className="text-xs font-black text-[#111111]">{share}% du budget</span>
                  </div>
                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex justify-between text-[#666660]">
                      <span>Dépense :</span>
                      <span className="font-bold text-[#111111]">{formatMoney(data.spend, "XOF")}</span>
                    </div>
                    <div className="flex justify-between text-[#666660]">
                      <span>Colis livrés :</span>
                      <span className="font-bold text-[#111111]">{data.deliveries}</span>
                    </div>
                    <div className="flex justify-between text-[#666660]">
                      <span>CPA Réel :</span>
                      <span className="font-bold text-blue-700">{formatMoney(cpa, "XOF")}</span>
                    </div>
                    <div className="flex justify-between text-[#666660]">
                      <span>ROAS Net :</span>
                      <span className="font-bold text-emerald-700">{roas}x</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollReveal>

      {/* Barre de Recherche & Filtres */}
      <ScrollReveal delay={120}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedPlatform("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                selectedPlatform === "all"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "bg-[#FAF8F5] border border-black/[0.08] text-[#666660] hover:text-[#111111]"
              )}
            >
              Toutes plateformes ({adSpends.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("meta")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                selectedPlatform === "meta"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "bg-[#FAF8F5] border border-black/[0.08] text-[#666660] hover:text-[#111111]"
              )}
            >
              Meta Ads
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("tiktok")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                selectedPlatform === "tiktok"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "bg-[#FAF8F5] border border-black/[0.08] text-[#666660] hover:text-[#111111]"
              )}
            >
              TikTok
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("google")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                selectedPlatform === "google"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "bg-[#FAF8F5] border border-black/[0.08] text-[#666660] hover:text-[#111111]"
              )}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlatform("snapchat")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                selectedPlatform === "snapchat"
                  ? "bg-[#111111] text-[#FAF8F5] shadow-xs"
                  : "bg-[#FAF8F5] border border-black/[0.08] text-[#666660] hover:text-[#111111]"
              )}
            >
              Snapchat
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#888880]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une campagne..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-black/[0.08] bg-white text-[#111111] placeholder:text-[#888880] focus:outline-none focus:ring-2 focus:ring-black/[0.12]"
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Tableau des Campagnes Publicitaires */}
      <ScrollReveal delay={150}>
        <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-black/[0.06] text-[#666660] font-bold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Plateforme</th>
                  <th className="py-3 px-4">Nom de la Campagne</th>
                  <th className="py-3 px-4">Pays</th>
                  <th className="py-3 px-4 text-right">Dépense Pub</th>
                  <th className="py-3 px-4 text-center">Colis Livrés</th>
                  <th className="py-3 px-4 text-right">CPA Réel</th>
                  <th className="py-3 px-4 text-right">CA Encaissé</th>
                  <th className="py-3 px-4 text-right">ROAS Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06]">
                {filteredSpends.map((ad) => {
                  const badge = getPlatformBadge(ad.platform);
                  const cpa = ad.deliveredOrdersCount > 0 ? Math.round(ad.spendAmount / ad.deliveredOrdersCount) : 0;
                  const roas = ad.spendAmount > 0 ? (ad.deliveredRevenue / ad.spendAmount).toFixed(2) : "0.00";

                  return (
                    <tr key={ad.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3 px-4 text-[#666660] whitespace-nowrap">{ad.date}</td>
                      <td className="py-3 px-4">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", badge.color)}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#111111] max-w-xs truncate">
                        {ad.campaignName}
                      </td>
                      <td className="py-3 px-4">
                        <CountryChip code={ad.country} />
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-700 whitespace-nowrap">
                        {formatMoney(ad.spendAmount, ad.currency)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-[#111111]">
                        {ad.deliveredOrdersCount}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-blue-700 whitespace-nowrap">
                        {formatMoney(cpa, ad.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700 whitespace-nowrap">
                        {formatMoney(ad.deliveredRevenue, ad.currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-black whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {roas}x
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ScrollReveal>

      {/* MODAL AJOUTER UNE DÉPENSE PUBLICITAIRE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08]">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[#111111]" />
                <h3 className="font-black text-base text-[#111111]">Nouvelle dépense publicitaire</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSpend} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Plateforme *</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as AdSpendRecord["platform"])}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  >
                    <option value="meta">Meta Ads (FB/IG)</option>
                    <option value="tiktok">TikTok Ads</option>
                    <option value="google">Google Ads</option>
                    <option value="snapchat">Snapchat Ads</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">Pays cible *</label>
                  <select
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  >
                    <option value="CI">🇨🇮 Côte d'Ivoire</option>
                    <option value="TG">🇹🇬 Togo</option>
                    <option value="SN">🇸🇳 Sénégal</option>
                    <option value="BJ">🇧🇯 Bénin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Nom de la Campagne *</label>
                <input
                  type="text"
                  required
                  value={newCampaign}
                  onChange={(e) => setNewCampaign(e.target.value)}
                  placeholder="Ex: CI_Crème_AntiTaches_Video02"
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                />
              </div>

              <div>
                <label className="font-bold text-[#111111] block mb-1">Dépense publicitaire (XOF) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newSpendAmount}
                  onChange={(e) => setNewSpendAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111] font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#111111] block mb-1">Colis livrés réels *</label>
                  <input
                    type="number"
                    min={0}
                    value={newDeliveredCount}
                    onChange={(e) => setNewDeliveredCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#111111] block mb-1">CA livré encaissé (XOF) *</label>
                  <input
                    type="number"
                    min={0}
                    value={newDeliveredRev}
                    onChange={(e) => setNewDeliveredRev(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-black/[0.1] bg-white text-[#111111]"
                  />
                </div>
              </div>

              {/* Aperçu du CPA et ROAS en direct */}
              {newSpendAmount > 0 && newDeliveredCount > 0 && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 flex items-center justify-between font-bold">
                  <span>CPA Réel calculé :</span>
                  <span>{formatMoney(Math.round(newSpendAmount / newDeliveredCount), "XOF")} / livraison</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#111111] font-bold text-[#FAF8F5] hover:bg-black"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT CSV */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-black/[0.1] bg-[#FAF8F5] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.08]">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#111111]" />
                <h3 className="font-black text-base text-[#111111]">Importer un fichier CSV</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1 rounded-lg text-[#888880] hover:text-[#111111]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#666660]">
                Téléversez un export CSV de vos plateformes publicitaires (Meta Ads Manager, TikTok Ads...).
                Le format attendu comporte : <code>Date, Plateforme, Campagne, Pays, Dépense</code>.
              </p>

              <div className="border-2 border-dashed border-black/20 rounded-2xl p-6 text-center bg-white hover:bg-[#FAF8F5] transition-colors cursor-pointer">
                <Upload className="h-8 w-8 text-[#888880] mx-auto mb-2" />
                <p className="font-bold text-[#111111]">Glissez-déposez votre fichier CSV ici</p>
                <p className="text-[11px] text-[#888880] mt-0.5">ou cliquez pour parcourir vos dossiers</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-black/[0.08] bg-white font-bold text-[#111111]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSimulateCsvImport}
                  className="px-4 py-2 rounded-xl bg-[#111111] font-bold text-[#FAF8F5] hover:bg-black"
                >
                  Importer les données
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
