"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Globe2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Download,
  Sliders,
  DollarSign,
  Truck,
  ArrowRight,
  ShieldAlert,
  BarChart2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOCK_MARKETS,
  getConsolidatedMarketOverview,
  simulateMarketProfitability,
  exportMarketsCsv,
} from "@/mock-data/markets";
import { MarketMetric, MarketVerdict, MarketSimulatorState } from "@/server/data/market-types";
import { UserRole } from "@/server/data/types";

interface MarketStatsClientProps {
  storeSlug: string;
}

export function MarketStatsClient({ storeSlug }: MarketStatsClientProps) {
  // Rôle simulé pour tester la restriction d'affichage Manager vs Admin
  const [currentRole, setCurrentRole] = useState<UserRole>("owner");
  const [selectedMarketId, setSelectedMarketId] = useState<string>("mkt_tg");

  // Simulateur interactif
  const [simulatorState, setSimulatorState] = useState<MarketSimulatorState>({
    marketId: "mkt_tg",
    cpaReceived: 5000,
    deliveryRate: 75,
    averageBasket: 25000,
    unitProductCost: 7000,
    unitShippingCost: 1500,
    unitFailedCost: 2000,
  });

  const overview = getConsolidatedMarketOverview();
  const selectedMarket = overview.markets.find((m) => m.id === selectedMarketId) || overview.markets[0];
  const simulationResult = simulateMarketProfitability(simulatorState);

  // Le rôle Manager ne voit pas les données financières (règle stricte Prompt)
  const isManager = currentRole === "manager";

  const handleDownloadCsv = () => {
    const csvContent = exportMarketsCsv(overview.markets);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `novika-marches-${storeSlug}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getVerdictBadge = (verdict: MarketVerdict, label: string) => {
    switch (verdict) {
      case "profitable":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#22C55E]/10 text-[#16A34A] border border-[#22C55E]/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>{label}</span>
          </span>
        );
      case "marginal":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/20">
            <AlertTriangle className="h-3 w-3" />
            <span>{label}</span>
          </span>
        );
      case "unprofitable":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EF4444]/10 text-[#DC2626] border border-[#EF4444]/20">
            <TrendingDown className="h-3 w-3" />
            <span>{label}</span>
          </span>
        );
      case "insufficient_data":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-black/[0.05] text-[#888880] border border-black/[0.08]">
            <HelpCircle className="h-3 w-3" />
            <span>{label}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#888880] mb-1">
            <Link href={`/app/${storeSlug}/stats`} className="hover:underline">
              Statistiques
            </Link>
            <span>›</span>
            <span className="text-[#111111] font-bold">Marchés & Rentabilité</span>
          </div>
          <h1 className="text-xl font-black text-[#111111] tracking-tight">
            Analyse de Rentabilité des Marchés
          </h1>
          <p className="text-xs text-[#666660]">
            Marge nette réelle, CPA sur commandes livrées, seuil d'équilibre d* et verdicts automatisés.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sélecteur de rôle simulé pour tester la sécurité d'accès Manager vs Admin */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white border border-black/[0.08] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#888880] px-1">Rôle :</span>
            <select
              id="market-role-selector"
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value as UserRole)}
              className="text-xs font-bold text-[#111111] bg-transparent border-none focus:outline-hidden cursor-pointer"
            >
              <option value="owner">Admin (Complet)</option>
              <option value="closer">Closeur (Lecture seule)</option>
              <option value="rider">Livreur (Lecture seule)</option>
              <option value="agency">Agence de livraison (Lecture seule)</option>
            </select>
          </div>

          <button
            type="button"
            id="export-markets-csv-btn"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-black/[0.08] text-xs font-bold text-[#111111] hover:bg-black/[0.04] transition-all shadow-2xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV sécurisé</span>
          </button>
        </div>
      </div>

      {/* Avertissement si rôle Manager */}
      {isManager && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-950 flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0" />
          <div>
            <span className="font-bold">Vue Manager restreinte : </span>
            <span>
              Conformément à la politique de sécurité Novika, les coûts d'achat unitaires, budgets publicitaires et marges nettes sont masqués. Seuls les volumes de commandes et les taux de livraison sont visibles.
            </span>
          </div>
        </div>
      )}

      {/* Cartes KPI de synthèse consolidée */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880] block mb-1">
            Marchés Actifs
          </span>
          <div className="text-xl font-black text-[#111111]">
            {overview.activeMarkets} / {overview.totalMarkets} pays
          </div>
          <p className="text-[10px] text-[#666660] mt-1">
            {overview.totalDeliveredOrders} livraisons réussies au total
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880] block mb-1">
            Taux de Livraison Moyen
          </span>
          <div className="text-xl font-black text-[#16A34A]">
            {overview.averageDeliveryRate}%
          </div>
          <p className="text-[10px] text-[#666660] mt-1">
            Moyenne pondérée des expéditions
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880] block mb-1">
            Marge Nette Consolidée
          </span>
          {isManager ? (
            <div className="text-xs font-bold text-[#888880] italic py-1">
              [Masqué · Rôle Manager]
            </div>
          ) : (
            <>
              <div className="text-xl font-black text-[#111111]">
                {overview.consolidatedNetMargin.toLocaleString("fr-FR")} FCFA
              </div>
              <p className="text-[10px] text-[#16A34A] font-bold mt-1">
                {overview.consolidatedNetMarginPercent}% du CA livré
              </p>
            </>
          )}
        </div>

        <div className="p-4 rounded-2xl bg-white border border-black/[0.08] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880] block mb-1">
            CPA Réel par Commande Livrée
          </span>
          {isManager ? (
            <div className="text-xs font-bold text-[#888880] italic py-1">
              [Masqué · Rôle Manager]
            </div>
          ) : (
            <>
              <div className="text-xl font-black text-[#111111]">
                {overview.averageRealCpa.toLocaleString("fr-FR")} FCFA
              </div>
              <p className="text-[10px] text-[#888880] mt-1">
                Budget pub ÷ Commandes livrées
              </p>
            </>
          )}
        </div>
      </div>

      {/* Grille principale : Classement des marchés & Nuage de points */}
      {overview.markets.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-black/[0.08] shadow-2xs space-y-3">
          <Globe2 className="h-10 w-10 text-[#888880] mx-auto opacity-40" />
          <h3 className="font-bold text-sm text-[#111111]">Aucune donnée de marché disponible</h3>
          <p className="text-xs text-[#666660] max-w-md mx-auto">
            Les statistiques par marché (taux de livraison, CPA réel, seuil d&apos;équilibre d*) s&apos;afficheront automatiquement dès que vos premières commandes seront expédiées.
          </p>
        </div>
      ) : selectedMarket ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne Gauche (7 cols) : Tableau & Barres de classement */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-black/[0.08] shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#888880]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                  Classement des Marchés par Rentabilité
                </h2>
              </div>
              <span className="text-[11px] text-[#888880]">Du plus au moins rentable</span>
            </div>

            <div className="space-y-3">
              {overview.markets
                .slice()
                .sort((a, b) => b.netMarginPercent - a.netMarginPercent)
                .map((market) => (
                  <div
                    key={market.id}
                    onClick={() => setSelectedMarketId(market.id)}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer",
                      selectedMarketId === market.id
                        ? "border-[#111111] bg-[#FAF8F5] shadow-xs"
                        : "border-black/[0.06] bg-white hover:border-black/[0.15]"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{market.flag}</span>
                        <span className="font-bold text-xs text-[#111111]">{market.countryName}</span>
                      </div>
                      {getVerdictBadge(market.verdict, market.verdictLabel)}
                    </div>

                    {/* Barre horizontale de marge % */}
                    {!isManager && (
                      <div className="space-y-1 mb-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-[#888880]">Marge nette sur CA livré :</span>
                          <span
                            className={cn(
                              "font-black",
                              market.netMarginPercent >= 10
                                ? "text-[#16A34A]"
                                : market.netMarginPercent >= 0
                                  ? "text-[#D97706]"
                                  : "text-[#DC2626]"
                            )}
                          >
                            {market.netMarginPercent > 0 ? `+${market.netMarginPercent}%` : `${market.netMarginPercent}%`}
                            {" "}
                            ({market.netMargin.toLocaleString("fr-FR")} FCFA)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-black/[0.04] overflow-hidden flex">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              market.netMarginPercent >= 10
                                ? "bg-[#22C55E]"
                                : market.netMarginPercent >= 0
                                  ? "bg-[#F59E0B]"
                                  : "bg-[#EF4444]"
                            )}
                            style={{
                              width: `${Math.max(5, Math.min(100, Math.abs(market.netMarginPercent) * 2.5))}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Métriques clés en ligne */}
                    <div className="grid grid-cols-4 gap-2 text-[10px] pt-1 border-t border-black/[0.04]">
                      <div>
                        <span className="text-[#888880] block">Reçues</span>
                        <span className="font-bold text-[#111111]">{market.receivedOrders}</span>
                      </div>
                      <div>
                        <span className="text-[#888880] block">Livrées</span>
                        <span className="font-bold text-[#111111]">{market.deliveredOrders}</span>
                      </div>
                      <div>
                        <span className="text-[#888880] block">Taux livr. (d)</span>
                        <span className="font-bold text-[#111111]">{market.deliveryRate}%</span>
                      </div>
                      <div>
                        <span className="text-[#888880] block">Seuil d*</span>
                        <span className="font-bold text-[#C2410C]">{market.breakevenDeliveryRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Colonne Droite (5 cols) : Fiche détaillée du marché sélectionné & Décomposition en cascade */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{selectedMarket.flag}</span>
                  <div>
                    <h3 className="font-black text-sm text-[#111111]">{selectedMarket.countryName}</h3>
                    <span className="text-[10px] text-[#888880]">Code : {selectedMarket.countryCode}</span>
                  </div>
                </div>
                {getVerdictBadge(selectedMarket.verdict, selectedMarket.verdictLabel)}
              </div>

              {/* Verdict et recommandation */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06] space-y-1.5 text-xs">
                <p className="text-[#111111] font-medium leading-relaxed">
                  {selectedMarket.verdictExplanation}
                </p>
                <div className="pt-1 text-[11px] text-[#C2410C] font-bold flex items-start gap-1">
                  <span>Action recommandée :</span>
                  <span>{selectedMarket.recommendation}</span>
                </div>
              </div>

              {/* Décomposition de la marge en cascade (Waterfall) */}
              {!isManager && (
                <div className="space-y-2 pt-1 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#888880] block">
                    Décomposition en cascade (P&L Marché)
                  </span>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#22C55E]/5 text-[#16A34A] font-bold">
                      <span>CA Livré (GMV)</span>
                      <span>+{selectedMarket.deliveredGmv.toLocaleString("fr-FR")} FCFA</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/[0.02] text-[#666660]">
                      <span>− Coût d'achat produits (COGS)</span>
                      <span>−{selectedMarket.productCost.toLocaleString("fr-FR")} FCFA</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/[0.02] text-[#666660]">
                      <span>− Frais livraisons réussies</span>
                      <span>−{selectedMarket.shippingCost.toLocaleString("fr-FR")} FCFA</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/[0.02] text-[#EF4444]">
                      <span>− Coût livraisons échouées ({selectedMarket.refusedOrders + selectedMarket.uncollectedOrders} colis)</span>
                      <span>−{selectedMarket.failedDeliveryCost.toLocaleString("fr-FR")} FCFA</span>
                    </div>

                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-black/[0.02] text-[#EF4444]">
                      <span>− Dépenses publicitaires (Ads)</span>
                      <span>−{selectedMarket.adSpend.toLocaleString("fr-FR")} FCFA</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-[#111111] text-[#FAF8F5] font-black mt-2">
                      <span>= Marge Nette Réelle</span>
                      <span>
                        {selectedMarket.netMargin > 0 ? "+" : ""}
                        {selectedMarket.netMargin.toLocaleString("fr-FR")} FCFA ({selectedMarket.netMarginPercent}%)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparaison d vs d* */}
              <div className="p-3 rounded-xl bg-white border border-black/[0.08] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#888880]">Taux de livraison actuel (d) :</span>
                  <span className="font-black text-[#111111]">{selectedMarket.deliveryRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#888880]">Seuil de rentabilité d* = (c+f)/(m+f) :</span>
                  <span className="font-black text-[#C2410C]">{selectedMarket.breakevenDeliveryRate}%</span>
                </div>
                <div className="text-[10px] text-[#666660] italic">
                  {selectedMarket.deliveryRate >= selectedMarket.breakevenDeliveryRate
                    ? `✓ Au-dessus du seuil (+${(selectedMarket.deliveryRate - selectedMarket.breakevenDeliveryRate).toFixed(1)} points) : le marché dégage un profit net.`
                    : `⚠️ En-dessous du seuil (-${(selectedMarket.breakevenDeliveryRate - selectedMarket.deliveryRate).toFixed(1)} points) : chaque livraison rapporte moins que les coûts d'acquisition et d'échec.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Simulateur interactif de rentabilité de marché */}
      <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#C2410C]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Simulateur Interactif de Marché COD (100 commandes types)
            </h2>
          </div>
          <span className="text-[11px] text-[#888880]">Ajustez les curseurs en temps réel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Curseur 1 : Taux de livraison */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06]">
            <div className="flex items-center justify-between font-bold">
              <span>Taux de livraison :</span>
              <span className="text-[#C2410C]">{simulatorState.deliveryRate}%</span>
            </div>
            <input
              type="range"
              id="slider-delivery-rate"
              min="30"
              max="95"
              step="1"
              value={simulatorState.deliveryRate}
              onChange={(e) =>
                setSimulatorState({ ...simulatorState, deliveryRate: Number(e.target.value) })
              }
              className="w-full accent-[#111111] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-[#888880]">
              <span>30%</span>
              <span>Seuil rentabilité</span>
              <span>95%</span>
            </div>
          </div>

          {/* Curseur 2 : CPA par commande reçue */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06]">
            <div className="flex items-center justify-between font-bold">
              <span>CPA commande reçue :</span>
              <span className="text-[#111111]">{simulatorState.cpaReceived.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <input
              type="range"
              id="slider-cpa-received"
              min="1500"
              max="12000"
              step="500"
              value={simulatorState.cpaReceived}
              onChange={(e) =>
                setSimulatorState({ ...simulatorState, cpaReceived: Number(e.target.value) })
              }
              className="w-full accent-[#111111] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-[#888880]">
              <span>1 500 FCFA</span>
              <span>6 000 FCFA</span>
              <span>12 000 FCFA</span>
            </div>
          </div>

          {/* Curseur 3 : Panier moyen */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06]">
            <div className="flex items-center justify-between font-bold">
              <span>Panier moyen :</span>
              <span className="text-[#111111]">{simulatorState.averageBasket.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <input
              type="range"
              id="slider-average-basket"
              min="15000"
              max="60000"
              step="1000"
              value={simulatorState.averageBasket}
              onChange={(e) =>
                setSimulatorState({ ...simulatorState, averageBasket: Number(e.target.value) })
              }
              className="w-full accent-[#111111] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-[#888880]">
              <span>15 000 FCFA</span>
              <span>35 000 FCFA</span>
              <span>60 000 FCFA</span>
            </div>
          </div>

          {/* Curseur 4 : Coût produit (COGS) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#FAF8F5] border border-black/[0.06]">
            <div className="flex items-center justify-between font-bold">
              <span>Coût d'achat unitaire :</span>
              <span className="text-[#111111]">{simulatorState.unitProductCost.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <input
              type="range"
              id="slider-unit-cogs"
              min="3000"
              max="20000"
              step="500"
              value={simulatorState.unitProductCost}
              onChange={(e) =>
                setSimulatorState({ ...simulatorState, unitProductCost: Number(e.target.value) })
              }
              className="w-full accent-[#111111] cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-[#888880]">
              <span>3 000 FCFA</span>
              <span>10 000 FCFA</span>
              <span>20 000 FCFA</span>
            </div>
          </div>
        </div>

        {/* Résultat de simulation en direct */}
        <div className="p-4 rounded-xl bg-[#FAF8F5] border border-black/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center font-black text-sm">
              100
            </div>
            <div>
              <span className="text-xs font-bold text-[#111111] block">
                Résultat sur 100 commandes reçues ({simulatorState.deliveryRate} livrées)
              </span>
              <span className="text-[11px] text-[#666660]">
                Marge nette simulée :{" "}
                <span className="font-bold text-[#111111]">
                  {simulationResult.netMarginAmount.toLocaleString("fr-FR")} FCFA
                </span>{" "}
                ({simulationResult.netMarginPercent}%)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-[#888880] block">Seuil d'équilibre calculé</span>
              <span className="text-sm font-black text-[#C2410C]">
                d* = {simulationResult.breakevenRate}%
              </span>
            </div>

            <div>{getVerdictBadge(simulationResult.verdict, simulationResult.verdictLabel)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
