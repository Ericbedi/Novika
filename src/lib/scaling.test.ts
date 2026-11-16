import { describe, it, expect } from "vitest";
import {
  calculateScalingMetrics,
  ScalingProductInput,
  analyzeWeeklyScaling,
  DEFAULT_WEEKLY_SCALING_HISTORY,
} from "./scaling";

describe("Prompt 05-G : Formules de scaling & Performance Produit", () => {
  it("valide exactement le cas de test canonique spécifié dans le cahier des charges", () => {
    // Cas de test spécifié :
    // A = 5 000, P = 15 000, L = 1 500, B = 3 000, r = 700, c = 40 %, S = 100 $
    const testInput: ScalingProductInput = {
      productId: "prod_canonique",
      productName: "Ceinture Amincissante",
      acquisitionPrice: 5000,
      sellingPrice: 15000,
      deliveryCost: 1500,
      desiredProfit: 3000,
      dollarRate: 700,
      closingRate: 0.40,
      adSpendDollars: 100,
      deliveredUnits: 13,
      pendingUnits: 5,
      ordersCount: 35,
      campaignDays: 5,
      phase: "expansion",
    };

    const metrics = calculateScalingMetrics(testInput);

    // 1. M = P - A - L = 15000 - 5000 - 1500 = 8 500
    expect(metrics.marginBeforeAds).toBe(8500);

    // 2. CPA breakeven (en $) = M / r = 8500 / 700 ≈ 12.14 $
    expect(Number(metrics.cpaBreakevenDollars.toFixed(2))).toBe(12.14);

    // 3. CPA cible (en $) = (M - B) / r = (8500 - 3000) / 700 = 5500 / 700 ≈ 7.86 $
    expect(metrics.cpaTargetDollars).not.toBeNull();
    expect(Number(metrics.cpaTargetDollars!.toFixed(2))).toBe(7.86);

    // 4. Quantité breakeven (pièces livrées) = S / CPA breakeven = 100 / (8500/700) ≈ 8.24 pièces
    expect(Number(metrics.qtyBreakevenUnits.toFixed(1))).toBe(8.2);

    // 5. Quantité cible (pièces livrées) = S / CPA cible = 100 / (5500/700) ≈ 12.73 pièces
    expect(metrics.qtyTargetUnits).not.toBeNull();
    expect(Number(metrics.qtyTargetUnits!.toFixed(1))).toBe(12.7);

    // 6. Coût par achat Meta maximal = CPA breakeven * c = 12.1428 * 0.40 ≈ 4.86 $
    expect(Number(metrics.maxMetaCostPerPurchase.toFixed(2))).toBe(4.86);

    // 7. Commandes à générer = quantité cible / c = 12.727 / 0.4 ≈ 31.8
    expect(metrics.ordersToGenerateTarget).not.toBeNull();
    expect(Number(metrics.ordersToGenerateTarget!.toFixed(1))).toBe(31.8);
  });

  it("gère correctement le cas où la marge est inférieure ou égale au bénéfice souhaité (M <= B)", () => {
    const insufficientMarginInput: ScalingProductInput = {
      productId: "prod_low_margin",
      productName: "Produit Trop Cher à l'achat",
      acquisitionPrice: 12000,
      sellingPrice: 15000,
      deliveryCost: 1500, // M = 15000 - 12000 - 1500 = 1 500
      desiredProfit: 3000, // B = 3000 > M
      dollarRate: 700,
      closingRate: 0.40,
      adSpendDollars: 100,
      deliveredUnits: 5,
      pendingUnits: 2,
      ordersCount: 25,
      campaignDays: 4,
      phase: "testing",
    };

    const metrics = calculateScalingMetrics(insufficientMarginInput);

    expect(metrics.isMarginSufficient).toBe(false);
    expect(metrics.marginErrorMessage).toBe("Marge insuffisante pour le bénéfice souhaité");
    expect(metrics.cpaTargetDollars).toBeNull();
    expect(metrics.qtyTargetUnits).toBeNull();
    expect(metrics.ordersToGenerateTarget).toBeNull();
  });

  it("attribue le verdict 'Données insuffisantes' si volume minimum non atteint", () => {
    const lowVolumeInput: ScalingProductInput = {
      productId: "prod_new",
      productName: "Nouveau Test",
      acquisitionPrice: 5000,
      sellingPrice: 15000,
      deliveryCost: 1500,
      desiredProfit: 3000,
      dollarRate: 700,
      closingRate: 0.40,
      adSpendDollars: 15, // < 2 * 12.14 $ = 24.28 $
      deliveredUnits: 1,
      pendingUnits: 2,
      ordersCount: 5,     // < 20
      campaignDays: 1,    // < 3
      phase: "testing",
    };

    const metrics = calculateScalingMetrics(lowVolumeInput);
    expect(metrics.verdict.key).toBe("insufficient_data");
    expect(metrics.verdict.label).toBe("Données insuffisantes");
  });

  it("ne coupe JAMAIS uniquement à cause de commandes encore en cours (prise en compte de la maturation)", () => {
    const matureTestInput: ScalingProductInput = {
      productId: "prod_ongoing",
      productName: "Produit en cours de livraison",
      acquisitionPrice: 5000,
      sellingPrice: 15000,
      deliveryCost: 1500,
      desiredProfit: 3000,
      dollarRate: 700,
      closingRate: 0.40,
      adSpendDollars: 30, // > 2 * 12.14
      deliveredUnits: 4,  // seulement 4 livrées pour l'instant
      pendingUnits: 15,   // 15 en cours ! 4 + 15 * 0.4 = 10 projetées >= 8.2 breakeven
      ordersCount: 25,
      campaignDays: 4,
      phase: "testing",
      consecutiveDaysOverBreakeven: 1, // pas 3 jours consécutifs
    };

    const metrics = calculateScalingMetrics(matureTestInput);
    // Le verdict ne doit pas être "cut"
    expect(metrics.verdict.key).not.toBe("cut");
  });

  describe("Extension Calendrier & Analyse Weekly : Détection d'Over-scaling vs Scaling Sain", () => {
    it("détecte précisément l'Over-scaling sévère de la Semaine 46 (cas réel de la capture utilisateur)", () => {
      const s46 = DEFAULT_WEEKLY_SCALING_HISTORY[0]; // S46: 355 $, 110 cmd, 32 livrées, 29.1% closing, profit -12 400 FCFA
      const s45 = DEFAULT_WEEKLY_SCALING_HISTORY[1]; // S45: 280 $, 93 cmd, 33 livrées, 35.5% closing, profit +32 500 FCFA

      const analysis = analyzeWeeklyScaling(s46, s45);

      // 1. Dépense Ads en hausse : +75 $ (+26.8 %)
      expect(analysis.deltaSpendDollars).toBe(75);
      expect(Number(analysis.deltaSpendPct.toFixed(1))).toBe(26.8);

      // 2. Livraisons en baisse malgré la hausse de budget : -1 (-3.0 %)
      expect(analysis.deltaDeliveredUnits).toBe(-1);
      expect(Number(analysis.deltaDeliveredPct.toFixed(1))).toBe(-3.0);

      // 3. CPA Réel en forte hausse (+30.8 %)
      expect(Number(analysis.deltaRealCpaPct.toFixed(1))).toBe(30.8);

      // 4. Profit Net effondré et négatif : -12 400 vs +32 500 (-44 900 FCFA, -138.2 %)
      expect(analysis.deltaProfitFcfa).toBe(-44900);
      expect(Number(analysis.deltaProfitPct.toFixed(1))).toBe(-138.2);

      // 5. Statut et Diagnostic : Over-scaling détecté
      expect(analysis.healthStatus).toBe("overscaling_danger");
      expect(analysis.healthLabel).toContain("Over-scaling Détecté");
      expect(analysis.actionRecommendation).toContain("Redescendez immédiatement");
    });

    it("détecte un Scaling Sain et Rentable quand le budget et le profit progressent ensemble (S44 vs S43)", () => {
      const s44 = DEFAULT_WEEKLY_SCALING_HISTORY[2]; // S44: 210 $, 34 livrées, profit +142 000 FCFA
      const s43 = DEFAULT_WEEKLY_SCALING_HISTORY[3]; // S43: 140 $, 24 livrées, profit +106 000 FCFA

      const analysis = analyzeWeeklyScaling(s44, s43);

      // Budget en hausse de +50 %
      expect(Number(analysis.deltaSpendPct.toFixed(1))).toBe(50.0);
      // Livraisons en hausse de +41.7 %
      expect(Number(analysis.deltaDeliveredPct.toFixed(1))).toBe(41.7);
      // Profit net en hausse de +34.0 % (+36 000 FCFA)
      expect(analysis.deltaProfitFcfa).toBe(36000);
      expect(Number(analysis.deltaProfitPct.toFixed(1))).toBe(34.0);

      // Diagnostic : Scaling Sain & Rentable
      expect(analysis.healthStatus).toBe("healthy_scaling");
      expect(analysis.healthLabel).toContain("Scaling Sain & Rentable");
      expect(analysis.actionRecommendation).toContain("Validation du palier");
    });

    it("détecte un palier de saturation / rendements décroissants (S45 vs S44)", () => {
      const s45 = DEFAULT_WEEKLY_SCALING_HISTORY[1]; // S45: 280 $, 33 livrées, profit +32 500 FCFA
      const s44 = DEFAULT_WEEKLY_SCALING_HISTORY[2]; // S44: 210 $, 34 livrées, profit +142 000 FCFA

      const analysis = analyzeWeeklyScaling(s45, s44);

      // Budget en hausse (+33.3 %), mais livraisons stagnantes/baissières (-2.9 %)
      expect(Number(analysis.deltaSpendPct.toFixed(1))).toBe(33.3);
      expect(Number(analysis.deltaDeliveredPct.toFixed(1))).toBe(-2.9);

      expect(analysis.healthStatus).toBe("warning_diminishing");
      expect(analysis.healthLabel).toContain("Rendements Décroissants");
      expect(analysis.actionRecommendation).toContain("Gelez le budget publicitaire");
    });
  });
});
