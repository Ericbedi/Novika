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

export const MOCK_MARKETS: MarketMetric[] = [
  // 1. TOGO (Marché historique principal - Très rentable)
  (() => {
    const received = 280;
    const confirmed = 245;
    const shipped = 240;
    const delivered = 205;
    const refused = 28;
    const uncollected = 7;
    const gmv = 5125000; // 205 * 25 000 FCFA
    const cogs = 1435000; // 205 * 7 000 FCFA
    const shipping = 307500; // 205 * 1 500 FCFA
    const failedCost = 70000; // 35 * 2 000 FCFA (frais retour)
    const adSpend = 1400000; // 5 000 FCFA par reçu
    const netMargin = gmv - cogs - shipping - failedCost - adSpend;
    const marginPct = (netMargin / gmv) * 100;
    const cpaReceived = adSpend / received; // 5 000
    const m = (gmv - cogs - shipping) / delivered; // 16 500
    const f = failedCost / (refused + uncollected); // 2 000
    const dStar = calculateBreakevenDeliveryRate(cpaReceived, f, m);
    const v = determineMarketVerdict(received, delivered, marginPct);

    return {
      id: "mkt_tg",
      countryCode: "TG",
      countryName: "Togo (Lomé & Régions)",
      flag: "🇹🇬",
      currency: "FCFA",
      receivedOrders: received,
      confirmedOrders: confirmed,
      shippedOrders: shipped,
      deliveredOrders: delivered,
      refusedOrders: refused,
      uncollectedOrders: uncollected,
      confirmationRate: Math.round((confirmed / received) * 1000) / 10,
      deliveryRate: Math.round((delivered / shipped) * 1000) / 10,
      cancellationRate: Math.round(((refused + uncollected) / shipped) * 1000) / 10,
      deliveredGmv: gmv,
      productCost: cogs,
      shippingCost: shipping,
      failedDeliveryCost: failedCost,
      adSpend,
      netMargin,
      netMarginPercent: Math.round(marginPct * 10) / 10,
      realCpa: Math.round(adSpend / delivered),
      realRoas: Math.round((gmv / adSpend) * 10) / 10,
      cpaPerReceived: Math.round(cpaReceived),
      grossMarginPerDelivered: Math.round(m),
      failedCostPerOrder: Math.round(f),
      breakevenDeliveryRate: dStar,
      verdict: v.verdict,
      verdictLabel: v.label,
      verdictExplanation: v.explanation,
      recommendation: v.recommendation,
    };
  })(),

  // 2. CÔTE D'IVOIRE (Grand volume - Rentable)
  (() => {
    const received = 410;
    const confirmed = 330;
    const shipped = 320;
    const delivered = 252;
    const refused = 54;
    const uncollected = 14;
    const gmv = 7560000; // 252 * 30 000 FCFA
    const cogs = 2268000; // 252 * 9 000 FCFA
    const shipping = 504000; // 252 * 2 000 FCFA
    const failedCost = 170000; // 68 * 2 500 FCFA
    const adSpend = 2460000; // 6 000 FCFA / reçu
    const netMargin = gmv - cogs - shipping - failedCost - adSpend;
    const marginPct = (netMargin / gmv) * 100;
    const cpaReceived = adSpend / received;
    const m = (gmv - cogs - shipping) / delivered;
    const f = failedCost / (refused + uncollected);
    const dStar = calculateBreakevenDeliveryRate(cpaReceived, f, m);
    const v = determineMarketVerdict(received, delivered, marginPct);

    return {
      id: "mkt_ci",
      countryCode: "CI",
      countryName: "Côte d'Ivoire (Abidjan)",
      flag: "🇨🇮",
      currency: "FCFA",
      receivedOrders: received,
      confirmedOrders: confirmed,
      shippedOrders: shipped,
      deliveredOrders: delivered,
      refusedOrders: refused,
      uncollectedOrders: uncollected,
      confirmationRate: Math.round((confirmed / received) * 1000) / 10,
      deliveryRate: Math.round((delivered / shipped) * 1000) / 10,
      cancellationRate: Math.round(((refused + uncollected) / shipped) * 1000) / 10,
      deliveredGmv: gmv,
      productCost: cogs,
      shippingCost: shipping,
      failedDeliveryCost: failedCost,
      adSpend,
      netMargin,
      netMarginPercent: Math.round(marginPct * 10) / 10,
      realCpa: Math.round(adSpend / delivered),
      realRoas: Math.round((gmv / adSpend) * 10) / 10,
      cpaPerReceived: Math.round(cpaReceived),
      grossMarginPerDelivered: Math.round(m),
      failedCostPerOrder: Math.round(f),
      breakevenDeliveryRate: dStar,
      verdict: v.verdict,
      verdictLabel: v.label,
      verdictExplanation: v.explanation,
      recommendation: v.recommendation,
    };
  })(),

  // 3. BÉNIN (Volume moyen - Limite 4.2%)
  (() => {
    const received = 140;
    const confirmed = 105;
    const shipped = 100;
    const delivered = 68;
    const refused = 26;
    const uncollected = 6;
    const gmv = 1700000; // 68 * 25 000 FCFA
    const cogs = 544000; // 68 * 8 000 FCFA
    const shipping = 136000; // 68 * 2 000 FCFA
    const failedCost = 80000; // 32 * 2 500 FCFA
    const adSpend = 868000; // 6 200 FCFA / reçu
    const netMargin = gmv - cogs - shipping - failedCost - adSpend; // 72 000 FCFA
    const marginPct = (netMargin / gmv) * 100; // 4.2%
    const cpaReceived = adSpend / received;
    const m = (gmv - cogs - shipping) / delivered;
    const f = failedCost / (refused + uncollected);
    const dStar = calculateBreakevenDeliveryRate(cpaReceived, f, m);
    const v = determineMarketVerdict(received, delivered, marginPct);

    return {
      id: "mkt_bj",
      countryCode: "BJ",
      countryName: "Bénin (Cotonou)",
      flag: "🇧🇯",
      currency: "FCFA",
      receivedOrders: received,
      confirmedOrders: confirmed,
      shippedOrders: shipped,
      deliveredOrders: delivered,
      refusedOrders: refused,
      uncollectedOrders: uncollected,
      confirmationRate: Math.round((confirmed / received) * 1000) / 10,
      deliveryRate: Math.round((delivered / shipped) * 1000) / 10,
      cancellationRate: Math.round(((refused + uncollected) / shipped) * 1000) / 10,
      deliveredGmv: gmv,
      productCost: cogs,
      shippingCost: shipping,
      failedDeliveryCost: failedCost,
      adSpend,
      netMargin,
      netMarginPercent: Math.round(marginPct * 10) / 10,
      realCpa: Math.round(adSpend / delivered),
      realRoas: Math.round((gmv / adSpend) * 10) / 10,
      cpaPerReceived: Math.round(cpaReceived),
      grossMarginPerDelivered: Math.round(m),
      failedCostPerOrder: Math.round(f),
      breakevenDeliveryRate: dStar,
      verdict: v.verdict,
      verdictLabel: v.label,
      verdictExplanation: v.explanation,
      recommendation: v.recommendation,
    };
  })(),

  // 4. CAMEROUN (Transport difficile - Non rentable -5.8%)
  (() => {
    const received = 110;
    const confirmed = 75;
    const shipped = 70;
    const delivered = 38;
    const refused = 24;
    const uncollected = 8;
    const gmv = 1140000; // 38 * 30 000 FCFA
    const cogs = 380000; // 38 * 10 000 FCFA
    const shipping = 114000; // 38 * 3 000 FCFA
    const failedCost = 112000; // 32 * 3 500 FCFA
    const adSpend = 600000; // 5 450 FCFA / reçu
    const netMargin = gmv - cogs - shipping - failedCost - adSpend; // -66 000 FCFA
    const marginPct = (netMargin / gmv) * 100; // -5.8%
    const cpaReceived = adSpend / received;
    const m = (gmv - cogs - shipping) / delivered;
    const f = failedCost / (refused + uncollected);
    const dStar = calculateBreakevenDeliveryRate(cpaReceived, f, m);
    const v = determineMarketVerdict(received, delivered, marginPct);

    return {
      id: "mkt_cm",
      countryCode: "CM",
      countryName: "Cameroun (Douala & Yaoundé)",
      flag: "🇨🇲",
      currency: "FCFA",
      receivedOrders: received,
      confirmedOrders: confirmed,
      shippedOrders: shipped,
      deliveredOrders: delivered,
      refusedOrders: refused,
      uncollectedOrders: uncollected,
      confirmationRate: Math.round((confirmed / received) * 1000) / 10,
      deliveryRate: Math.round((delivered / shipped) * 1000) / 10,
      cancellationRate: Math.round(((refused + uncollected) / shipped) * 1000) / 10,
      deliveredGmv: gmv,
      productCost: cogs,
      shippingCost: shipping,
      failedDeliveryCost: failedCost,
      adSpend,
      netMargin,
      netMarginPercent: Math.round(marginPct * 10) / 10,
      realCpa: Math.round(adSpend / delivered),
      realRoas: Math.round((gmv / adSpend) * 10) / 10,
      cpaPerReceived: Math.round(cpaReceived),
      grossMarginPerDelivered: Math.round(m),
      failedCostPerOrder: Math.round(f),
      breakevenDeliveryRate: dStar,
      verdict: v.verdict,
      verdictLabel: v.label,
      verdictExplanation: v.explanation,
      recommendation: v.recommendation,
    };
  })(),

  // 5. SÉNÉGAL (Lancement récent - Données insuffisantes : 18 reçues, 11 livrées)
  (() => {
    const received = 18;
    const confirmed = 14;
    const shipped = 13;
    const delivered = 11;
    const refused = 2;
    const uncollected = 0;
    const gmv = 330000;
    const cogs = 99000;
    const shipping = 27500;
    const failedCost = 5000;
    const adSpend = 120000;
    const netMargin = gmv - cogs - shipping - failedCost - adSpend;
    const marginPct = (netMargin / gmv) * 100;
    const cpaReceived = adSpend / received;
    const m = (gmv - cogs - shipping) / delivered;
    const f = failedCost / (refused + uncollected || 1);
    const dStar = calculateBreakevenDeliveryRate(cpaReceived, f, m);
    const v = determineMarketVerdict(received, delivered, marginPct);

    return {
      id: "mkt_sn",
      countryCode: "SN",
      countryName: "Sénégal (Dakar)",
      flag: "🇸🇳",
      currency: "FCFA",
      receivedOrders: received,
      confirmedOrders: confirmed,
      shippedOrders: shipped,
      deliveredOrders: delivered,
      refusedOrders: refused,
      uncollectedOrders: uncollected,
      confirmationRate: Math.round((confirmed / received) * 1000) / 10,
      deliveryRate: Math.round((delivered / shipped) * 1000) / 10,
      cancellationRate: Math.round(((refused + uncollected) / shipped) * 1000) / 10,
      deliveredGmv: gmv,
      productCost: cogs,
      shippingCost: shipping,
      failedDeliveryCost: failedCost,
      adSpend,
      netMargin,
      netMarginPercent: Math.round(marginPct * 10) / 10,
      realCpa: Math.round(adSpend / delivered),
      realRoas: Math.round((gmv / adSpend) * 10) / 10,
      cpaPerReceived: Math.round(cpaReceived),
      grossMarginPerDelivered: Math.round(m),
      failedCostPerOrder: Math.round(f),
      breakevenDeliveryRate: dStar,
      verdict: v.verdict,
      verdictLabel: v.label,
      verdictExplanation: v.explanation,
      recommendation: v.recommendation,
    };
  })(),
];

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
    consolidatedNetMarginPercent: Math.round((totalMargin / totalGmv) * 1000) / 10,
    averageDeliveryRate: Math.round((totalDelivered / totalShipped) * 1000) / 10,
    averageRealCpa: Math.round(totalAdSpend / totalDelivered),
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
