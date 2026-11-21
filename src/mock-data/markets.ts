import { MarketMetric, ConsolidatedMarketOverview, MarketVerdict, MarketSimulatorState } from "@/server/data/market-types";

/**
 * Calcul déterministe du seuil de rentabilité de livraison (Breakeven Delivery Rate)
 * Formule Prompt Part 1 : d* = (c + f) / (m + f)
 * @param cpaReceived Coût d'acquisition par commande reçue (dépenses pub / commandes reçues)
 * @param failedCost Coût moyen d'une commande refusée/retournée (frais aller-retour + packaging)
 * @param grossMarginPerDelivered Marge brute unitaire par commande livrée (Prix - COGS - Frais livraison réussie)
 */
export function calculateBreakevenDeliveryRate(
  cpaReceived: number,
  failedCost: number,
  grossMarginPerDelivered: number
): number {
  const denominator = grossMarginPerDelivered + failedCost;
  if (denominator <= 0) return 100;
  const rate = ((cpaReceived + failedCost) / denominator) * 100;
  return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
}

/**
 * Détermination automatisée du verdict de marché
 */
export function determineMarketVerdict(
  receivedOrders: number,
  deliveredOrders: number,
  netMarginPercent: number
): { verdict: MarketVerdict; label: string; explanation: string; recommendation: string } {
  // Règle 4 : Données insuffisantes si < 30 commandes résolues ou < 15 livrées
  if (receivedOrders < 30 || deliveredOrders < 15) {
    return {
      verdict: "insufficient_data",
      label: "Données insuffisantes",
      explanation: "Échantillon trop faible (< 30 commandes résolues ou < 15 livrées). Marge non significative statistiquement.",
      recommendation: "Poursuivre les tests sur quelques dizaines de commandes supplémentaires avant de statuer.",
    };
  }

  // Règle 1 : Rentable si marge nette >= 10%
  if (netMarginPercent >= 10) {
    return {
      verdict: "profitable",
      label: "Rentable",
      explanation: `Marge nette saine (${netMarginPercent.toFixed(1)}%). Le taux de livraison couvre largement le CPA et les coûts d'échec.`,
      recommendation: "Augmentez progressivement vos budgets publicitaires sur ce marché pour scaler le volume.",
    };
  }

  // Règle 2 : Limite si marge nette entre 0% et 10%
  if (netMarginPercent >= 0) {
    return {
      verdict: "marginal",
      label: "Limite",
      explanation: `Rentabilité sous tension (${netMarginPercent.toFixed(1)}%). Le marché génère du bénéfice mais la moindre hausse du CPA ou baisse du taux de livraison l'amènera en perte.`,
      recommendation: "Optimisez la confirmation des closeuses et réduisez les délais de livraison avant tout nouvel investissement ad.",
    };
  }

  // Règle 3 : Non rentable si marge nette < 0%
  return {
    verdict: "unprofitable",
    label: "Non rentable",
    explanation: `Marché déficitaire (${netMarginPercent.toFixed(1)}%). Les coûts combinés d'acquisition et des retours dépassent les gains des commandes livrées.`,
    recommendation: "Stoppez temporairement les campagnes ou renégociez les tarifs transporteurs et le prix produit.",
  };
}

export const MOCK_MARKETS: MarketMetric[] = [];

export function getConsolidatedMarketOverview(): ConsolidatedMarketOverview {
  const markets = MOCK_MARKETS;
  const totalReceived = markets.reduce((acc, m) => acc + m.receivedOrders, 0);
  const totalDelivered = markets.reduce((acc, m) => acc + m.deliveredOrders, 0);
  const totalShipped = markets.reduce((acc, m) => acc + m.shippedOrders, 0);
  const totalGmv = markets.reduce((acc, m) => acc + m.deliveredGmv, 0);
  const totalMargin = markets.reduce((acc, m) => acc + m.netMargin, 0);
  const totalAdSpend = markets.reduce((acc, m) => acc + m.adSpend, 0);

  return {
    totalMarkets: markets.length,
    activeMarkets: markets.filter((m) => m.receivedOrders > 0).length,
    totalReceivedOrders: totalReceived,
    totalDeliveredOrders: totalDelivered,
    consolidatedGmv: totalGmv,
    consolidatedNetMargin: totalMargin,
    consolidatedNetMarginPercent: totalGmv > 0 ? Math.round((totalMargin / totalGmv) * 1000) / 10 : 0,
    averageDeliveryRate: totalShipped > 0 ? Math.round((totalDelivered / totalShipped) * 1000) / 10 : 0,
    averageRealCpa: totalDelivered > 0 ? Math.round(totalAdSpend / totalDelivered) : 0,
    markets,
  };
}

/**
 * Calcul du simulateur interactif de marché en temps réel
 */
export function simulateMarketProfitability(input: MarketSimulatorState): {
  netMarginAmount: number;
  netMarginPercent: number;
  breakevenRate: number;
  verdict: MarketVerdict;
  verdictLabel: string;
} {
  const simulatedOrders = 100;
  const delivered = Math.round((simulatedOrders * input.deliveryRate) / 100);
  const failed = simulatedOrders - delivered;

  const totalGmv = delivered * input.averageBasket;
  const totalCogs = delivered * input.unitProductCost;
  const totalShipping = delivered * input.unitShippingCost;
  const totalFailed = failed * input.unitFailedCost;
  const totalAds = simulatedOrders * input.cpaReceived;

  const netMargin = totalGmv - totalCogs - totalShipping - totalFailed - totalAds;
  const netMarginPercent = totalGmv > 0 ? (netMargin / totalGmv) * 100 : 0;

  const m = input.averageBasket - input.unitProductCost - input.unitShippingCost;
  const breakeven = calculateBreakevenDeliveryRate(input.cpaReceived, input.unitFailedCost, m);
  const v = determineMarketVerdict(simulatedOrders, delivered, netMarginPercent);

  return {
    netMarginAmount: Math.round(netMargin),
    netMarginPercent: Math.round(netMarginPercent * 10) / 10,
    breakevenRate: breakeven,
    verdict: v.verdict,
    verdictLabel: v.label,
  };
}

/**
 * Génération de CSV sécurisé avec neutralisation des formules (anti injection CSV)
 * Règle Prompt : Tout champ commençant par '=', '+', '-', '@' est préfixé d'une apostrophe.
 */
export function exportMarketsCsv(markets: MarketMetric[]): string {
  const headers = [
    "Marché",
    "Code",
    "Commandes reçues",
    "Commandes livrées",
    "Taux de livraison (%)",
    "Seuil de rentabilité d* (%)",
    "CA Livré (FCFA)",
    "Marge Nette (FCFA)",
    "Marge Nette (%)",
    "CPA Réel (FCFA)",
    "ROAS Réel",
    "Verdict",
  ];

  const escapeCell = (val: string | number) => {
    let str = String(val);
    if (/^[=+\-@]/.test(str)) {
      str = "'" + str;
    }
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      str = `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = markets.map((m) => [
    escapeCell(m.countryName),
    escapeCell(m.countryCode),
    escapeCell(m.receivedOrders),
    escapeCell(m.deliveredOrders),
    escapeCell(m.deliveryRate),
    escapeCell(m.breakevenDeliveryRate),
    escapeCell(m.deliveredGmv),
    escapeCell(m.netMargin),
    escapeCell(m.netMarginPercent),
    escapeCell(m.realCpa),
    escapeCell(m.realRoas),
    escapeCell(m.verdictLabel),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
