/**
 * Calculateur des 3 indicateurs de performance produit avec sélecteur de période (Prompt 17 - Phase 17-A).
 * Formules strictes sur commandes LIVRÉES uniquement :
 * 1. Taux de vente moyen = unités vendues ÷ (unités vendues + stock restant)
 * 2. Produits par jours de stock restants = stock disponible ÷ ventes moyennes par jour
 * 3. Analyse ABC : classement par chiffre d'affaires livré cumulé (A: 80%, B: 15%, C: 5%)
 */

import { Product, Order } from "@/server/data/types";

export type IndicatorPeriod = "today" | "7d" | "30d" | "90d";

export interface SellThroughRateResult {
  hasData: boolean;
  ratePercent: number | null; // ex: 42.5
  totalSoldUnits: number;
  totalRemainingStock: number;
  formattedRate: string; // ex: "42,5 %" ou "Aucune donnée"
}

export interface ProductStockRunway {
  productId: string;
  name: string;
  stock: number;
  avgDailySales: number;
  daysRemaining: number;
  isUrgent: boolean; // < 7 jours
}

export interface DaysOfStockResult {
  hasData: boolean;
  criticalCount: number; // < 7 jours
  warningCount: number; // 7-15 jours
  healthyCount: number; // > 15 jours
  criticalProducts: ProductStockRunway[];
  summaryText: string; // ex: "3 produits < 7 j de stock" ou "Aucune donnée"
}

export interface AbcProductItem {
  productId: string;
  name: string;
  revenue: number;
  cumulatedShare: number; // 0 à 100
  classCategory: "A" | "B" | "C";
}

export interface AbcAnalysisResult {
  hasData: boolean;
  totalRevenue: number;
  classACount: number;
  classBCount: number;
  classCCount: number;
  topAProducts: AbcProductItem[];
  summaryText: string; // ex: "A: 3 · B: 5 · C: 12" ou "Aucune donnée"
}

export interface ProductDashboardIndicators {
  period: IndicatorPeriod;
  deliveredOrdersCount: number;
  sellThrough: SellThroughRateResult;
  runway: DaysOfStockResult;
  abc: AbcAnalysisResult;
}

/**
 * Filtre les commandes livrées sur la période spécifiée.
 */
export function filterDeliveredOrdersByPeriod(
  orders: Order[],
  period: IndicatorPeriod,
  referenceNow: number = Date.now()
): Order[] {
  const delivered = orders.filter((o) => o && o.status === "delivered");
  if (delivered.length === 0) return [];

  const msInDay = 24 * 60 * 60 * 1000;
  const daysLimit =
    period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const cutoffTime = referenceNow - daysLimit * msInDay;

  return delivered.filter((o) => {
    // Parser la date de commande ou de livraison
    const dateStr = o.updatedAt || o.createdAt;
    if (!dateStr) return true;

    // Support format DD/MM/YYYY
    if (dateStr.includes("/")) {
      const parts = dateStr.split(" ")[0].split("/");
      if (parts.length === 3) {
        const d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
        return isNaN(d) || d >= cutoffTime;
      }
    }

    const t = new Date(dateStr).getTime();
    return isNaN(t) || t >= cutoffTime;
  });
}

/**
 * Calcule les 3 indicateurs de performance produit pour la période donnée.
 */
export function calculateProductIndicators(
  products: Product[],
  orders: Order[],
  period: IndicatorPeriod = "30d",
  referenceNow: number = Date.now()
): ProductDashboardIndicators {
  const validProducts = products.filter((p) => p && !p.deletedAt);
  const deliveredOrders = filterDeliveredOrdersByPeriod(orders, period, referenceNow);

  const daysCount =
    period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;

  // 1. Calcul des ventes par produit sur les commandes livrées
  const salesByProduct: Map<string, { units: number; revenue: number }> = new Map();

  deliveredOrders.forEach((order) => {
    if (Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const prodId = item.productId || (item as any).id || "unknown";
        const qty = Number(item.quantity) || 1;
        const total = Number(item.totalPrice) || (Number(item.unitPrice) || 0) * qty;

        const current = salesByProduct.get(prodId) || { units: 0, revenue: 0 };
        current.units += qty;
        current.revenue += total;
        salesByProduct.set(prodId, current);
      });
    }
  });

  const totalSoldUnits = Array.from(salesByProduct.values()).reduce(
    (acc, curr) => acc + curr.units,
    0
  );

  const totalRemainingStock = validProducts.reduce((acc, p) => {
    const st = p.availableStock !== undefined ? p.availableStock : (p.stock || 0);
    return acc + Math.max(0, st);
  }, 0);

  // =========================================================================
  // INDICATEUR 1 : TAUX DE VENTE MOYEN
  // Formule : unités vendues ÷ (unités vendues + stock restant)
  // =========================================================================
  let sellThrough: SellThroughRateResult;
  const denominator = totalSoldUnits + totalRemainingStock;

  if (deliveredOrders.length === 0 || totalSoldUnits === 0 || denominator === 0) {
    sellThrough = {
      hasData: false,
      ratePercent: null,
      totalSoldUnits: 0,
      totalRemainingStock,
      formattedRate: "Aucune donnée",
    };
  } else {
    const rawRate = (totalSoldUnits / denominator) * 100;
    const roundedRate = Math.round(rawRate * 10) / 10;
    sellThrough = {
      hasData: true,
      ratePercent: roundedRate,
      totalSoldUnits,
      totalRemainingStock,
      formattedRate: `${roundedRate.toLocaleString("fr-FR")}%`,
    };
  }

  // =========================================================================
  // INDICATEUR 2 : PRODUITS PAR JOURS DE STOCK RESTANTS
  // Formule : stock disponible ÷ ventes moyennes par jour
  // =========================================================================
  let runway: DaysOfStockResult;
  if (deliveredOrders.length === 0 || salesByProduct.size === 0) {
    runway = {
      hasData: false,
      criticalCount: 0,
      warningCount: 0,
      healthyCount: 0,
      criticalProducts: [],
      summaryText: "Aucune donnée",
    };
  } else {
    const runwayList: ProductStockRunway[] = [];
    let crit = 0;
    let warn = 0;
    let health = 0;

    validProducts.forEach((p) => {
      const sales = salesByProduct.get(p.id) || salesByProduct.get(p.slug) || { units: 0, revenue: 0 };
      const currentStock = p.availableStock !== undefined ? p.availableStock : (p.stock || 0);

      // Si le produit n'a aucune vente dans la période, on ne peut pas calculer un rythme journalier
      if (sales.units === 0) return;

      const avgDailySales = sales.units / daysCount;
      const daysRemaining = avgDailySales > 0 ? Math.round(currentStock / avgDailySales) : 999;

      if (daysRemaining < 7) {
        crit++;
      } else if (daysRemaining <= 15) {
        warn++;
      } else {
        health++;
      }

      runwayList.push({
        productId: p.id,
        name: p.name || p.title || "Produit",
        stock: currentStock,
        avgDailySales: Math.round(avgDailySales * 10) / 10,
        daysRemaining,
        isUrgent: daysRemaining < 7,
      });
    });

    runwayList.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const summary =
      runwayList.length === 0
        ? "Aucune donnée"
        : crit > 0
        ? `${crit} produit${crit > 1 ? "s" : ""} < 7 j de stock`
        : warn > 0
        ? `${warn} produit${warn > 1 ? "s" : ""} en stock modéré (7-15 j)`
        : "Stock confortable (> 15 j)";

    runway = {
      hasData: runwayList.length > 0,
      criticalCount: crit,
      warningCount: warn,
      healthyCount: health,
      criticalProducts: runwayList.slice(0, 5),
      summaryText: summary,
    };
  }

  // =========================================================================
  // INDICATEUR 3 : ANALYSE ABC (80% / 15% / 5% DU CA LIVRÉ CUMULÉ)
  // =========================================================================
  let abc: AbcAnalysisResult;
  const totalRevenue = Array.from(salesByProduct.values()).reduce(
    (acc, curr) => acc + curr.revenue,
    0
  );

  if (deliveredOrders.length === 0 || totalRevenue === 0) {
    abc = {
      hasData: false,
      totalRevenue: 0,
      classACount: 0,
      classBCount: 0,
      classCCount: 0,
      topAProducts: [],
      summaryText: "Aucune donnée",
    };
  } else {
    // Calcul de la part pour chaque produit
    const productRevenues: { id: string; name: string; revenue: number }[] = [];

    validProducts.forEach((p) => {
      const sales = salesByProduct.get(p.id) || salesByProduct.get(p.slug) || { units: 0, revenue: 0 };
      if (sales.revenue > 0) {
        productRevenues.push({
          id: p.id,
          name: p.name || p.title || "Produit",
          revenue: sales.revenue,
        });
      }
    });

    productRevenues.sort((a, b) => b.revenue - a.revenue);

    let runningSum = 0;
    let countA = 0;
    let countB = 0;
    let countC = 0;
    const classified: AbcProductItem[] = [];

    productRevenues.forEach((item) => {
      runningSum += item.revenue;
      const share = (runningSum / totalRevenue) * 100;

      let cat: "A" | "B" | "C";
      if (share <= 80 || countA === 0) {
        cat = "A";
        countA++;
      } else if (share <= 95 || countB === 0) {
        cat = "B";
        countB++;
      } else {
        cat = "C";
        countC++;
      }

      classified.push({
        productId: item.id,
        name: item.name,
        revenue: item.revenue,
        cumulatedShare: Math.round(share * 10) / 10,
        classCategory: cat,
      });
    });

    abc = {
      hasData: classified.length > 0,
      totalRevenue,
      classACount: countA,
      classBCount: countB,
      classCCount: countC,
      topAProducts: classified.filter((c) => c.classCategory === "A").slice(0, 3),
      summaryText: `A: ${countA} · B: ${countB} · C: ${countC}`,
    };
  }

  return {
    period,
    deliveredOrdersCount: deliveredOrders.length,
    sellThrough,
    runway,
    abc,
  };
}
