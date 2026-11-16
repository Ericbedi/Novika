/**
 * Types pour l'analyse de rentabilité des marchés (PARTIE 1 — STATS > MARCHÉS)
 */

export type MarketVerdict = "profitable" | "marginal" | "unprofitable" | "insufficient_data";

export interface MarketMetric {
  id: string;
  countryCode: string; // Ex: "TG", "CI", "BJ", "SN", "CM"
  countryName: string;
  flag: string;
  currency: string;
  // Volumes
  receivedOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  refusedOrders: number;
  uncollectedOrders: number;
  // Taux
  confirmationRate: number; // en % (ex: 85.4)
  deliveryRate: number;     // en % (ex: 78.2)
  cancellationRate: number; // en % (ex: 14.6)
  // Financier (en devise locale ou de référence FCFA)
  deliveredGmv: number;
  productCost: number;      // COGS des commandes livrées
  shippingCost: number;     // Frais de transport des livraisons réussies
  failedDeliveryCost: number; // Coût des échecs (aller + retour + packaging)
  adSpend: number;          // Dépenses publicitaires attribuées au marché
  netMargin: number;        // GMV - COGS - Shipping - Failed - Ads
  netMarginPercent: number; // (NetMargin / DeliveredGmv) * 100
  realCpa: number;          // AdSpend / DeliveredOrders
  realRoas: number;         // DeliveredGmv / AdSpend
  // Seuil de rentabilité d* = (c + f) / (m + f)
  cpaPerReceived: number;   // c
  grossMarginPerDelivered: number; // m
  failedCostPerOrder: number;      // f
  breakevenDeliveryRate: number;   // d* en %
  // Verdict automatisé
  verdict: MarketVerdict;
  verdictLabel: string;
  verdictExplanation: string;
  recommendation: string;
}

export interface ConsolidatedMarketOverview {
  totalMarkets: number;
  activeMarkets: number;
  totalReceivedOrders: number;
  totalDeliveredOrders: number;
  consolidatedGmv: number;
  consolidatedNetMargin: number;
  consolidatedNetMarginPercent: number;
  averageDeliveryRate: number;
  averageRealCpa: number;
  markets: MarketMetric[];
}

export interface MarketSimulatorState {
  marketId: string;
  cpaReceived: number;       // en FCFA
  deliveryRate: number;      // en %
  averageBasket: number;     // en FCFA
  unitProductCost: number;   // en FCFA
  unitShippingCost: number;  // en FCFA
  unitFailedCost: number;    // en FCFA
}
